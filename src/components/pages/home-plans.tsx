"use client";

import { usePocket } from "@/components/providers/pocket-provider";
import { BudgetSummaryRow } from "@/components/ui/budget-summary-row";
import { PlanRecord } from "@/components/pages/plan-record";
import { RecordRemoveButton } from "@/components/ui/record-remove-button";
import { financeOf, planSummary } from "@/lib/finance";

export function HomePlans({ amount, masked = false }: { date: string; amount: number; masked?: boolean }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const overdue = finance.plans.filter((plan) => plan.date < pocket.today && !planSummary(pocket.data, plan).completed);
  return <div className="flex min-w-0 flex-1 flex-col gap-2">
    <BudgetSummaryRow title="약속 예산" amount={masked ? null : amount}>
      {!masked && <p>선택한 기간에 남겨둘 약속 비용이에요. 예산 설정에서 날짜별 약속을 관리할 수 있어요.</p>}
    </BudgetSummaryRow>
    {!masked && overdue.length > 0 && <details className="rounded-lg bg-black-002 px-3 py-2">
      <summary className="cursor-pointer py-1 text-sm font-semibold">지난 약속 · {overdue.length}건</summary>
      <div className="flex flex-col gap-2 pt-2">
        {overdue.map((plan) => <PlanRecord key={plan.id} plan={plan} action={<RecordRemoveButton planned label={`${plan.memo || "약속"} 예정 해제`} onClick={() => pocket.saveFinance({ ...finance, plans: finance.plans.filter((item) => item.id !== plan.id) })} />} />)}
      </div>
    </details>}
  </div>;
}
