"use client";

import { ChevronRight } from "lucide-react";

import { usePocket } from "@/components/providers/pocket-provider";
import { IconContainer } from "@/components/ui/icon-container";

import { financeOf, settlementSummary } from "@/lib/finance";
import { formatMoney, shortDate, sumExpenses } from "@/lib/pocket";
import type { Expense } from "@/lib/pocket";

const expenseCard = "flex w-full items-center gap-3 rounded-xl border border-black-010 bg-black-002 px-3 py-4";

export function ExpenseList({ expenses, grouped = false, onSelect }: { expenses: Expense[]; grouped?: boolean; onSelect?: (expense: Expense) => void }) {
  const { openEditor, today, data } = usePocket();
  if (!expenses.length) return <div className={expenseCard}>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-sm font-semibold leading-140">잘하고 있어요!</p>
      <p className="text-xs leading-140 text-black-030">기록된 지출이 없어요.</p>
    </div>
    <span className="font-numbers shrink-0 text-sm font-semibold leading-150">0원</span>
  </div>;
  const dates = grouped ? [...new Set(expenses.map((expense) => expense.date))] : [""];
  return <div className="flex flex-col gap-5">{dates.map((date) => {
    const group = grouped ? expenses.filter((expense) => expense.date === date) : expenses;
    return <section key={date} className="flex flex-col gap-2">
      {grouped && <div className="flex items-center justify-between gap-3 text-xs leading-150 text-black-030"><h2>{date === today ? "오늘" : shortDate(date)}</h2><span className="font-numbers font-semibold text-black-100">{formatMoney(sumExpenses(group))}원</span></div>}
      <div className="flex flex-col gap-2">{group.map((expense) => <button key={expense.id} data-expense-id={expense.id} type="button" onClick={() => (onSelect ?? openEditor)(expense)} className={expenseCard + " cursor-pointer text-left hover:border-black-020"} aria-label={`${expense.memo || expense.category}, ${formatMoney(expense.amount)}원, 수정`}>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1"><span className="break-words text-sm font-semibold leading-140">{expense.memo || expense.category}</span><span className="text-xs leading-140 text-black-030">{expense.category}</span>{financeOf(data).payments[expense.id] && <span className="text-xs leading-150 text-black-030">{financeOf(data).payments[expense.id].method === "card" ? "신용카드" : "현금·체크"} · 총 {formatMoney(financeOf(data).payments[expense.id].gross)}원 ÷ {financeOf(data).payments[expense.id].split}명 {financeOf(data).payments[expense.id].split > 1 ? "· 정산 " + settlementSummary(financeOf(data).payments[expense.id]).count + "/" + (financeOf(data).payments[expense.id].split - 1) + "명 받음" : ""}</span>}{financeOf(data).payments[expense.id]?.split > 1 && <span className="text-xs leading-150 text-black-030">받을 금액 {formatMoney(settlementSummary(financeOf(data).payments[expense.id], expense.amount).outstanding)}원</span>}{financeOf(data).payments[expense.id]?.note && <span className="break-words text-xs leading-150 text-black-030">메모: {financeOf(data).payments[expense.id].note}</span>}</span>
        <span className="font-numbers shrink-0 text-sm font-semibold leading-150">−{formatMoney(expense.amount)}원</span>
        <IconContainer className="text-black-030"><ChevronRight /></IconContainer>
      </button>)}</div>
    </section>;
  })}</div>;
}
