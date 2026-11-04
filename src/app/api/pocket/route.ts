import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isPocketWrite, isSameOriginWrite, MAX_BODY_BYTES, POCKET_ACCOUNT_HEADER } from "@/lib/pocket-api";
import { PocketConflict, readPocket, writePocket } from "@/lib/server/pocket-repository";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const headers = { "Cache-Control": "private, no-store" };

async function verifiedOwner(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ code: "SESSION_REQUIRED" }, { status: 401, headers });
  }
  // Bind each request to the account the client was displaying before it sent the request.
  if (request.headers.get(POCKET_ACCOUNT_HEADER) !== user.id) {
    return NextResponse.json({ code: "ACCOUNT_CHANGED" }, { status: 403, headers });
  }
  return createHash("sha256").update(`account:${user.id}`).digest("hex");
}

function unavailable() {
  return NextResponse.json({ code: "DATABASE_NOT_CONFIGURED", message: "서버 저장이 설정되지 않았습니다." }, { status: 503, headers });
}

function failure(error: unknown) {
  if (error instanceof PocketConflict) return NextResponse.json({ code: "REVISION_CONFLICT", message: "다른 화면에서 기록이 변경되었습니다." }, { status: 409, headers });
  console.error("Pocket database request failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ code: "DATABASE_UNAVAILABLE", message: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요." }, { status: 503, headers });
}

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) return unavailable();
  try {
    const owner = await verifiedOwner(request);
    if (owner instanceof Response) return owner;
    return NextResponse.json(await readPocket(owner), { headers });
  } catch (error) { return failure(error); }
}

export async function PUT(request: NextRequest) {
  if (!isSameOriginWrite(request)) return NextResponse.json({ code: "INVALID_ORIGIN" }, { status: 403, headers });
  if (!process.env.DATABASE_URL) return unavailable();
  try {
    const owner = await verifiedOwner(request);
    if (owner instanceof Response) return owner;
    if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return NextResponse.json({ code: "PAYLOAD_TOO_LARGE" }, { status: 413, headers });
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return NextResponse.json({ code: "PAYLOAD_TOO_LARGE" }, { status: 413, headers });
    let input: unknown;
    try { input = JSON.parse(body); } catch { return NextResponse.json({ code: "INVALID_JSON" }, { status: 400, headers }); }
    if (!isPocketWrite(input)) return NextResponse.json({ code: "INVALID_DATA", message: "기록 내용을 확인해주세요." }, { status: 400, headers });
    return NextResponse.json(await writePocket(owner, input), { headers });
  } catch (error) { return failure(error); }
}
