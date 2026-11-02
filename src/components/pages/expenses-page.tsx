"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { CATEGORIES, formatMoney, getPeriod, getPeriodExpenses, offsetDate, sumExpenses } from "@/lib/pocket";

export function ExpensesPage() {
  const pocket = usePocket();
  const [weekOffset, setWeekOffset] = useState(0);
  if (!pocket.ready) return <PageSkeleton />;
  const period = pocket.data.mode === "weekly"
    ? getPeriod("weekly", pocket.data.weekStartsOn, offsetDate(pocket.today, weekOffset * 7))
    : pocket.period;
  const periodExpenses = pocket.data.mode === "weekly" ? getPeriodExpenses(pocket.data.expenses, period) : pocket.expenses;
  const filtered = periodExpenses.filter((expense) => pocket.category === "전체" || expense.category === pocket.category);
  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title="지출 내역" subtitle={pocket.data.mode === "weekly" ? "주별로 기록을 확인할 수 있어요" : `${period.label} · ${period.scope}`} />
    {pocket.data.mode === "weekly" && <div className="flex items-center justify-between rounded-lg border border-black-010 px-3 py-2"><PillButton aria-label="이전 주" variant="ghost" size="icon" onClick={() => setWeekOffset((offset) => offset - 1)}><IconContainer size="slg"><ChevronLeft /></IconContainer></PillButton><span className="text-sm leading-150">{period.weekNumber}주차 · {period.label}</span><PillButton aria-label="다음 주" variant="ghost" size="icon" disabled={weekOffset >= 0} onClick={() => setWeekOffset((offset) => Math.min(0, offset + 1))}><IconContainer size="slg"><ChevronRight /></IconContainer></PillButton></div>}
    <div className="flex items-center justify-between gap-3"><span className="text-sm leading-150 text-black-030">{pocket.category === "전체" ? "전체 지출" : `${pocket.category} 지출`}</span><p className="font-numbers text-2xl leading-140">{formatMoney(sumExpenses(filtered))}원</p></div>
    <div className="flex flex-wrap gap-2" aria-label="카테고리 필터">{["전체", ...CATEGORIES, ...pocket.data.categories].map((category) => <PillButton key={category} variant={pocket.category === category ? "filled" : "outline"} size="sm" aria-pressed={pocket.category === category} onClick={() => pocket.setCategory(category)}>{category}</PillButton>)}</div>
    <ExpenseList expenses={filtered} grouped />
  </div>;
}
