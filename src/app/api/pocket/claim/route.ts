import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json({ message: "자동 기록 합치기가 종료됐습니다. 페이지를 새로고침해주세요." }, {
    status: 410, headers: { "Cache-Control": "private, no-store" },
  });
}
