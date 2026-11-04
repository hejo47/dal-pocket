"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { usePocket } from "@/components/providers/pocket-provider";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DateField, FieldLabel, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { financeOf } from "@/lib/finance";
import { formatMoney, isDateKey, parseAmount, validAmount } from "@/lib/pocket";

export function HomePlans({ date }: { date: string }) {
  const pocket = usePocket();
  const [open, setOpen] = useState(false);
  const [planDate, setPlanDate] = useState(date);
  const [error, setError] = useState("");
  const finance = financeOf(pocket.data);
  const overdue = finance.plans.filter((plan) => plan.date < pocket.today);

  function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const planDate = String(fields.get("date"));
    const amount = parseAmount(String(fields.get("amount")));
    if (!isDateKey(planDate) || !validAmount(amount)) {
      setError("약속 날짜와 예상 비용을 확인해주세요.");
      return;
    }
    const memo = String(fields.get("memo") ?? "").trim();
    pocket.saveFinance({ ...finance, plans: [...finance.plans, { id: crypto.randomUUID(), date: planDate, amount, memo }] });
    setOpen(false);
  }

  return <div className="flex min-w-0 flex-col gap-2">
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); setError(""); if (next) setPlanDate(date); }}>
      <DialogTrigger asChild><PillButton type="button" variant="outline" size="sm" className="self-start">약속 비용 설정</PillButton></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>약속 비용 설정</DialogTitle>
          <DialogDescription>약속 날짜와 예상 비용을 기록해두세요.</DialogDescription>
        </DialogHeader>
        <form className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto" onSubmit={savePlan}>
          <div className="flex min-w-0 flex-col gap-2">
            <FieldLabel htmlFor="home-plan-date" required>약속 날짜</FieldLabel>
            <DateField id="home-plan-date" name="date" value={planDate} onValueChange={setPlanDate} required />
            <FieldLabel htmlFor="home-plan-memo">약속 이름</FieldLabel>
            <TextField id="home-plan-memo" name="memo" maxLength={80} />
            <FieldLabel htmlFor="home-plan-amount" required>예상 비용 (원)</FieldLabel>
            <TextField id="home-plan-amount" name="amount" inputMode="numeric" required />
            {error && <p role="alert" className="text-sm text-red-2">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><PillButton type="button" variant="outline">취소</PillButton></DialogClose>
            <PillButton type="submit">약속 예산 저장</PillButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {overdue.length > 0 && <details className="rounded-lg bg-black-002 px-3 py-2">
      <summary className="cursor-pointer py-1 text-sm font-semibold">지난 약속 지출 등록 · {overdue.length}건</summary>
      <div className="flex flex-col gap-2 pt-2">
        {overdue.map((plan) => <div key={plan.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold">{plan.memo || "약속"}</p>
            <p className="text-xs text-black-030">{plan.date} · 예상 {formatMoney(plan.amount)}원</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PillButton type="button" size="sm" onClick={() => pocket.openPlanExpense(plan)}>실제 지출 등록</PillButton>
            <PillButton type="button" size="sm" variant="ghost" onClick={() => pocket.saveFinance({ ...finance, plans: finance.plans.filter((item) => item.id !== plan.id) })}>예정 해제</PillButton>
          </div>
        </div>)}
      </div>
    </details>}
  </div>;
}
