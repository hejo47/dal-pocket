"use client";

import { useState } from "react";
import { SquarePen } from "lucide-react";
import { PlanEditor } from "@/components/pages/plan-editor";
import { usePocket } from "@/components/providers/pocket-provider";
import { BudgetSummaryRow } from "@/components/ui/budget-summary-row";
import { IconLink } from "@/components/ui/icon-link";
import { IconButton } from "@/components/ui/icon-button";
import { RecordRemoveButton } from "@/components/ui/record-remove-button";
import { PillButton } from "@/components/ui/pill-button";
import { financeOf } from "@/lib/finance";
import { formatMoney } from "@/lib/pocket";

export function HomePlans({ date, amount, masked = false }: { date: string; amount: number; masked?: boolean }) {
  const pocket = usePocket();
  const [open, setOpen] = useState(false);
  const finance = financeOf(pocket.data);
  const overdue = finance.plans.filter((plan) => plan.date < pocket.today);
  return <div className="flex min-w-0 flex-1 flex-col gap-2">
    <BudgetSummaryRow title="약속 예산" amount={masked ? null : amount} action={masked
      ? <IconLink href="/account" label="약속 비용 설정"><SquarePen /></IconLink>
      : <IconButton label="약속 비용 설정" onClick={() => setOpen(true)}><SquarePen /></IconButton>} />
    {open && <PlanEditor date={date} open={open} onOpenChange={setOpen} />}
    {!masked && overdue.length > 0 && <details className="rounded-lg bg-black-002 px-3 py-2">
      <summary className="cursor-pointer py-1 text-sm font-semibold">지난 약속 지출 등록 · {overdue.length}건</summary>
      <div className="flex flex-col gap-2 pt-2">
        {overdue.map((plan) => <div key={plan.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold">{plan.memo || "약속"}</p>
            <p className="text-xs text-black-030">{plan.date} · 예상 {formatMoney(plan.amount)}원</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PillButton type="button" size="sm" onClick={() => pocket.openPlanExpense(plan)}>실제 지출 등록</PillButton>
            <RecordRemoveButton planned label={`${plan.memo || "약속"} 예정 해제`} onClick={() => pocket.saveFinance({ ...finance, plans: finance.plans.filter((item) => item.id !== plan.id) })} />
          </div>
        </div>)}
      </div>
    </details>}
  </div>;
}
