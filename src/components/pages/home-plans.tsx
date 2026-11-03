"use client";

import { usePocket } from "@/components/providers/pocket-provider";
import { TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { financeOf } from "@/lib/finance";
import { formatMoney, isDateKey, parseAmount, validAmount } from "@/lib/pocket";

export function HomePlans({ date }: { date: string }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const overdue = finance.plans.filter((plan) => plan.date < pocket.today);

  return <section aria-label="약속 비용" className="flex flex-col gap-3 rounded-xl border border-black-010 p-4">
    <h2 className="font-semibold">약속 비용 설정</h2>
    <form className="flex min-w-0 flex-col gap-2" onSubmit={(event) => {
      event.preventDefault();
      const fields = new FormData(event.currentTarget);
      const date = String(fields.get("date"));
      const amount = parseAmount(String(fields.get("amount")));
      if (!isDateKey(date) || !validAmount(amount)) return;
      const memo = String(fields.get("memo") ?? "").trim();
      pocket.saveFinance({ ...finance, plans: [...finance.plans, { id: crypto.randomUUID(), date, amount, memo }] });
      event.currentTarget.reset();
    }}>
      <TextField aria-label="약속 날짜" name="date" type="date" defaultValue={date} required />
      <TextField aria-label="약속 이름" name="memo" placeholder="약속 이름" maxLength={80} />
      <TextField aria-label="예상 비용" name="amount" placeholder="예상 비용 (원)" inputMode="numeric" required />
      <PillButton type="submit" variant="outline">약속 예산 저장</PillButton>
    </form>
    {overdue.length > 0 && <div className="flex flex-col gap-3 border-t border-black-010 pt-3">
      <h3 className="text-sm">지난 약속의 실제 지출을 기록해주세요</h3>
      {overdue.map((plan) => <div key={plan.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black-002 p-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{plan.memo || "약속"}</p>
          <p className="text-xs text-black-030">{plan.date} · 예상 {formatMoney(plan.amount)}원</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PillButton type="button" size="sm" onClick={() => pocket.openPlanExpense(plan)}>실제 지출 등록</PillButton>
          <PillButton type="button" size="sm" variant="ghost" onClick={() => pocket.saveFinance({ ...finance, plans: finance.plans.filter((item) => item.id !== plan.id) })}>예정 해제</PillButton>
        </div>
      </div>)}
    </div>}
  </section>;
}
