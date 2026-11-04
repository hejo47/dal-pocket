"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { usePocket } from "@/components/providers/pocket-provider";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateField, FieldLabel, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import type { MoneyEntry } from "@/lib/finance";
import { financeOf } from "@/lib/finance";
import { isDateKey, parseAmount, validAmount } from "@/lib/pocket";

export function PlanEditor({ date, open, onOpenChange, plan }: { date: string; open: boolean; onOpenChange: (open: boolean) => void; plan?: MoneyEntry }) {
  const pocket = usePocket();
  const [planDate, setPlanDate] = useState(date);
  const [error, setError] = useState("");
  const finance = financeOf(pocket.data);

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
    pocket.saveFinance({ ...finance, plans: plan ? finance.plans.map((entry) => entry.id === plan.id ? { ...entry, date: planDate, amount, memo } : entry) : [...finance.plans, { id: crypto.randomUUID(), date: planDate, amount, memo }] });
    onOpenChange(false);
  }

  return <Dialog open={open} onOpenChange={(next) => { setError(""); onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>약속 비용 설정</DialogTitle>
          <DialogDescription>약속 날짜와 예상 비용을 기록해두세요.</DialogDescription>
        </DialogHeader>
        <form className="pocket-dialog-scroll flex flex-col gap-4" onSubmit={savePlan}>
          <div className="flex min-w-0 flex-col gap-2">
            <FieldLabel htmlFor="home-plan-date" required>약속 날짜</FieldLabel>
            <DateField id="home-plan-date" name="date" value={planDate} onValueChange={setPlanDate} required />
            <FieldLabel htmlFor="home-plan-memo">약속 이름</FieldLabel>
            <TextField id="home-plan-memo" name="memo" maxLength={80} defaultValue={plan?.memo} />
            <FieldLabel htmlFor="home-plan-amount" required>예상 비용 (원)</FieldLabel>
            <TextField id="home-plan-amount" name="amount" inputMode="numeric" defaultValue={plan?.amount} required />
            {error && <p role="alert" className="text-sm text-red-2">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><PillButton type="button" variant="outline">취소</PillButton></DialogClose>
            <PillButton type="submit">약속 예산 저장</PillButton>
          </DialogFooter>
        </form>
      </DialogContent>
  </Dialog>;
}
