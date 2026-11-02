"use client";

import { ChevronRight } from "lucide-react";

import { usePocket } from "@/components/providers/pocket-provider";
import { IconContainer } from "@/components/ui/icon-container";

import { formatMoney, shortDate, sumExpenses } from "@/lib/pocket";
import type { Expense } from "@/lib/pocket";

export function ExpenseList({ expenses, grouped = false }: { expenses: Expense[]; grouped?: boolean }) {
  const { openEditor, today } = usePocket();
  if (!expenses.length) return <div className="flex flex-col gap-2 py-10 text-sm leading-160 text-black-030"><p>기록한 지출이 없습니다.</p><p className="text-xs">지출 추가 버튼으로 첫 기록을 남겨보세요.</p></div>;
  const dates = grouped ? [...new Set(expenses.map((expense) => expense.date))] : [""];
  return <div className="flex flex-col gap-5">{dates.map((date) => {
    const group = grouped ? expenses.filter((expense) => expense.date === date) : expenses;
    return <section key={date} className="flex flex-col gap-1">
      {grouped && <div className="flex items-center justify-between gap-3 text-xs leading-150 text-black-030"><h2>{date === today ? "오늘" : shortDate(date)}</h2><span className="font-numbers">{formatMoney(sumExpenses(group))}원</span></div>}
      <div className="flex flex-col">{group.map((expense) => <button key={expense.id} data-expense-id={expense.id} type="button" onClick={() => openEditor(expense)} className="flex w-full cursor-pointer items-center gap-3 border-b border-black-010 py-4 text-left last:border-0" aria-label={`${expense.memo || expense.category}, ${formatMoney(expense.amount)}원, 수정`}>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1"><span className="break-words text-sm leading-140">{expense.memo || expense.category}</span><span className="text-xs leading-140 text-black-030">{expense.category}</span></span>
        <span className="font-numbers shrink-0 text-sm leading-150">−{formatMoney(expense.amount)}원</span>
        <IconContainer className="text-black-030"><ChevronRight /></IconContainer>
      </button>)}</div>
    </section>;
  })}</div>;
}
