"use client";

import { useState } from "react";
import { usePocket } from "@/components/providers/pocket-provider";
import { MoneyRow } from "@/components/ui/money-row";
import { PeriodPicker } from "@/components/ui/period-picker";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";
import { SignInNotice } from "@/components/ui/sign-in-notice";
import { getCalendarMonth, WEEKDAYS } from "@/lib/pocket";

const screens = {
  "/calendar": { title: "소비 달력", labels: ["주차별 예산"], message: "로그인하면 날짜별 지출을 볼 수 있어요." },
  "/analysis": { title: "지출 분석", labels: ["일반 지출", "고정 지출", "카드 출금 합계"], message: "로그인하면 이달 지출 분석을 볼 수 있어요." },
  "/finance": { title: "현금 흐름·예정 지출", labels: ["월말 예상 현금 잔액", "이달 고정 비용", "이달 순저축"], message: "로그인하면 수입과 현금 흐름을 볼 수 있어요." },
  "/budget": { title: "예산 설정", labels: ["배정 예산", "주 식비 배정"], message: "로그인하면 내 예산을 설정할 수 있어요." },
};

export function SignedOutPage({ pathname, checking }: { pathname: string; checking: boolean }) {
  const { today, ready, data } = usePocket();
  const [selected, setSelected] = useState<string | null>(null);
  if (!ready) return <PageSkeleton />;
  const date = selected ?? today.slice(0, 7) + "-01";
  const screen = screens[pathname as keyof typeof screens];
  const calendar = pathname === "/calendar" ? getCalendarMonth(date.slice(0, 7), data.weekStartsOn, []) : null;

  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title={screen?.title ?? "달주머니"} />
    {screen && <PeriodPicker date={date} onChange={setSelected} maxDate={pathname === "/analysis" ? today : undefined} />}
    {calendar ? <section aria-label="날짜별 지출" className="flex flex-col gap-4 rounded-xl bg-black-002 p-3">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-black-030">
        {Array.from({ length: 7 }, (_, i) => WEEKDAYS[(data.weekStartsOn + i) % 7]).map((day) => <span key={day}>{day.slice(0, 1)}</span>)}
      </div>
      {calendar.weeks.map((week) => <div key={week.number} className="flex flex-col gap-2">
        <div className="flex justify-between rounded-md bg-white px-3 py-2 text-xs"><span>{week.number}주차 예산</span><span className="font-numbers">??원</span></div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">{week.days.map((day) => <span key={day.date} className="py-2">{day.inMonth ? Number(day.date.slice(8)) : ""}</span>)}</div>
      </div>)}
    </section> : screen && <dl className="rounded-xl border border-black-010 px-4">
      {screen.labels.map((label) => <MoneyRow key={label} label={label} amount={null} />)}
    </dl>}
    <SignInNotice checking={checking}>{screen?.message ?? "로그인하면 내 기록을 볼 수 있어요."}</SignInNotice>
  </div>;
}
