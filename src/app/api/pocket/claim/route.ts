import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { isPocketData, todayInSeoul } from "@/lib/pocket";
import { financeOf } from "@/lib/finance";
import type { PocketData } from "@/lib/pocket";
import { isSameOriginWrite, MAX_BODY_BYTES } from "@/lib/pocket-api";
import { deletePocket, PocketConflict, readPocket, writePocket } from "@/lib/server/pocket-repository";
import { createClient } from "@/lib/supabase/server";

const COOKIE = "dal-pocket-session";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest) {
  if (!isSameOriginWrite(request)) return NextResponse.json({ message: "요청을 확인해주세요." }, { status: 403, headers });
  if (!process.env.DATABASE_URL) return NextResponse.json({ message: "서버 저장이 설정되지 않았습니다." }, { status: 503, headers });
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401, headers });
    if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return NextResponse.json({ message: "기록이 너무 많습니다." }, { status: 413, headers });
    const bodyText = await request.text();
    if (Buffer.byteLength(bodyText, "utf8") > MAX_BODY_BYTES) return NextResponse.json({ message: "기록이 너무 많습니다." }, { status: 413, headers });
    const body: unknown = JSON.parse(bodyText);
    if (!body || typeof body !== "object" || !("data" in body)) return NextResponse.json({ message: "기록을 확인해주세요." }, { status: 400, headers });
    const localData = (body as { data: unknown }).data;
    if (localData !== null && (!isPocketData(localData) || localData.isDemo)) return NextResponse.json({ message: "브라우저 기록 형식이 올바르지 않습니다." }, { status: 400, headers });

    const ownerId = createHash("sha256").update(`account:${user.id}`).digest("hex");
    const account = await readPocket(ownerId);
    const anonSecret = request.cookies.get(COOKIE)?.value;
    const anonId = anonSecret && /^[a-f0-9]{64}$/.test(anonSecret) ? createHash("sha256").update(anonSecret).digest("hex") : null;
    const anonymous = anonId ? await readPocket(anonId) : null;
    const sources = [account.data, anonymous?.data, localData].filter((data): data is PocketData => data !== null && data !== undefined && !data.isDemo);
    if (!sources.length) return NextResponse.json(account, { headers });

    const base = account.data ?? sources[0]!;
    const expenses = new Map<string, (typeof base.expenses)[number]>();
    for (const source of sources) for (const expense of source.expenses) expenses.set(expense.id, expense);
    const financialSources = sources.map(financeOf);
    const finance = { ...financeOf(base) };
    finance.months = Object.assign({}, ...financialSources.slice().reverse().map((item) => item.months));
    finance.payments = Object.assign({}, ...financialSources.map((item) => item.payments));
    for (const type of ["incomes", "plans", "installments"] as const) {
      const entries = new Map(financialSources.flatMap((item) => item[type]).map((item) => [item.id, item]));
      if (type === "installments") finance.installments = [...entries.values()].filter((item): item is import("@/lib/finance").Installment => "months" in item);
      else finance[type] = [...entries.values()];
    }
    finance.fixedExpenses = [...new Map(financialSources.flatMap((item) => item.fixedExpenses ?? []).map((item) => [item.id, item])).values()];
    const merged = {
      ...base, finance,
      categories: [...new Set(sources.flatMap((source) => source.categories))].slice(0, 30),
      expenses: [...expenses.values()].sort((a, b) => b.date.localeCompare(a.date)),
      isDemo: false,
    };
    if (merged.expenses.length > 10000 || merged.expenses.some((expense) => expense.date > todayInSeoul())) return NextResponse.json({ message: "기록을 확인해주세요." }, { status: 400, headers });
    const packet = await writePocket(ownerId, { data: merged, revision: account.revision });
    if (anonId && anonId !== ownerId) await deletePocket(anonId);
    return NextResponse.json(packet, { headers });
  } catch (cause) {
    if (cause instanceof PocketConflict) return NextResponse.json({ message: "다른 기기에서 기록이 변경됐습니다. 다시 로그인해주세요." }, { status: 409, headers });
    console.error("Pocket account claim failed", cause instanceof Error ? cause.name : "UnknownError");
    return NextResponse.json({ message: "기록을 계정에 연결하지 못했습니다." }, { status: 503, headers });
  }
}
