import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isPocketWrite, isSameOriginWrite, MAX_BODY_BYTES } from "@/lib/pocket-api";
import { PocketConflict, readPocket, writePocket } from "@/lib/server/pocket-repository";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const COOKIE = "dal-pocket-session";
const headers = { "Cache-Control": "private, no-store" };

async function identity(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return { secret: "", isNew: false, ownerId: createHash("sha256").update(`account:${user.id}`).digest("hex") };
    } catch { /* Fall back to the existing private browser session if Auth is unavailable. */ }
  }
  const stored = request.cookies.get(COOKIE)?.value;
  const secret = stored && /^[a-f0-9]{64}$/.test(stored) ? stored : randomBytes(32).toString("hex");
  return { secret, isNew: secret !== stored, ownerId: createHash("sha256").update(secret).digest("hex") };
}

function unavailable() {
  return NextResponse.json({ code: "DATABASE_NOT_CONFIGURED", message: "이 브라우저에 기록을 저장합니다." }, { status: 503, headers });
}

function failure(error: unknown) {
  if (error instanceof PocketConflict) return NextResponse.json({ code: "REVISION_CONFLICT", message: "다른 화면에서 기록이 변경되었습니다." }, { status: 409, headers });
  console.error("Pocket database request failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ code: "DATABASE_UNAVAILABLE", message: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요." }, { status: 503, headers });
}

export async function GET(request: NextRequest) {
  const owner = await identity(request);
  if (!process.env.DATABASE_URL) return unavailable();
  try {
    const response = NextResponse.json(await readPocket(owner.ownerId), { headers });
    if (owner.isNew) response.cookies.set(COOKIE, owner.secret, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch (error) { return failure(error); }
}

export async function PUT(request: NextRequest) {
  if (!isSameOriginWrite(request)) return NextResponse.json({ code: "INVALID_ORIGIN" }, { status: 403, headers });
  if (!process.env.DATABASE_URL) return unavailable();
  const owner = await identity(request);
  if (owner.isNew) return NextResponse.json({ code: "SESSION_REQUIRED" }, { status: 401, headers });
  try {
    if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return NextResponse.json({ code: "PAYLOAD_TOO_LARGE" }, { status: 413, headers });
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return NextResponse.json({ code: "PAYLOAD_TOO_LARGE" }, { status: 413, headers });
    let input: unknown;
    try { input = JSON.parse(body); } catch { return NextResponse.json({ code: "INVALID_JSON" }, { status: 400, headers }); }
    if (!isPocketWrite(input)) return NextResponse.json({ code: "INVALID_DATA", message: "기록 내용을 확인해주세요." }, { status: 400, headers });
    return NextResponse.json(await writePocket(owner.ownerId, input), { headers });
  } catch (error) { return failure(error); }
}
