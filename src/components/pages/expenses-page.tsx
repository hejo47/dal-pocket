"use client";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { PillButton } from "@/components/ui/pill-button";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { CATEGORIES, formatMoney, sumExpenses } from "@/lib/pocket";

export function ExpensesPage() {
  const pocket = usePocket();
  if (!pocket.ready) return <PageSkeleton />;
  const filtered = pocket.expenses.filter((expense) => pocket.category === "전체" || expense.category === pocket.category);
  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title="지출 내역" subtitle={`${pocket.period.label} · ${pocket.period.scope}`} />
    <div className="flex items-center justify-between gap-3"><span className="text-sm leading-150 text-black-030">{pocket.category === "전체" ? "전체 지출" : `${pocket.category} 지출`}</span><p className="font-numbers text-2xl leading-140">{formatMoney(sumExpenses(filtered))}원</p></div>
    <div className="flex flex-wrap gap-2" aria-label="카테고리 필터">{(["전체", ...CATEGORIES] as const).map((category) => <PillButton key={category} variant={pocket.category === category ? "filled" : "outline"} size="sm" aria-pressed={pocket.category === category} onClick={() => pocket.setCategory(category)}>{category}</PillButton>)}</div>
    <ExpenseList expenses={filtered} grouped />
  </div>;
}
