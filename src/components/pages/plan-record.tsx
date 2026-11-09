"use client";

import { useState } from "react";
import { BadgeCheck, Link2 } from "lucide-react";
import { PlanExpensePicker } from "@/components/pages/plan-expense-picker";
import { usePocket } from "@/components/providers/pocket-provider";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";
import { planSummary } from "@/lib/finance";
import type { PlanEntry } from "@/lib/finance";
import type { Expense } from "@/lib/pocket";
import { formatMoney, shortDate } from "@/lib/pocket";
import type { ReactNode } from "react";

export function PlanRecord({ plan, action, onExpenseSelect }: { plan: PlanEntry; action?: ReactNode; onExpenseSelect?: (expense: Expense) => void }) {
  const pocket = usePocket();
  const [linkOpen, setLinkOpen] = useState(false);
  const summary = planSummary(pocket.data, plan);
  return <div className="flex min-w-0 flex-col gap-2 border-t border-black-010 py-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs text-black-030">{shortDate(plan.date)}</p>{summary.completed && <span className="inline-flex items-center gap-1 rounded-full bg-black-100 px-2 py-1 text-xs font-semibold text-white"><IconContainer size="sm"><BadgeCheck /></IconContainer>기록 완료</span>}</div><p className="break-words text-sm font-semibold">{plan.memo || "약속"}</p></div>
      {action && <div className="flex shrink-0">{action}</div>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-black-030">예산 <span className="font-numbers">{formatMoney(plan.amount)}원</span>{summary.completed && <> · 실제 <span className="font-numbers font-semibold text-black-100">{formatMoney(summary.actual)}원</span></>}</p>
      <PillButton size="sm" variant="ghost" onClick={() => { setLinkOpen(true); }}><IconContainer size="sm"><Link2 /></IconContainer>{summary.completed ? `연결 수정 · ${summary.expenses.length}건` : "지출 내역 연결"}</PillButton>
    </div>
    {summary.completed && <details><summary className="cursor-pointer text-xs text-black-030">연결된 내역 보기</summary><div className="flex flex-col gap-1 pt-2">{summary.expenses.map((expense) => <button key={expense.id} type="button" className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-black-002 px-3 py-2 text-left text-xs" onClick={() => (onExpenseSelect ?? pocket.openEditor)(expense)}><span className="min-w-0 break-words">{shortDate(expense.date)} · {expense.memo || expense.category}</span><span className="font-numbers shrink-0 font-semibold">{formatMoney(expense.amount)}원</span></button>)}</div></details>}
    {linkOpen && <PlanExpensePicker plan={plan} onClose={() => setLinkOpen(false)} />}
  </div>;
}
