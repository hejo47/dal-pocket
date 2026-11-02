"use client";

import { useState } from "react";

import { usePocket } from "@/components/providers/pocket-provider";
import { FieldHint, FieldLabel, SelectField, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";
import { monthDays, monthSettings } from "@/lib/finance";
import { formatMoney, parseAmount, WEEKDAYS } from "@/lib/pocket";

function BudgetForm({ month }: { month: string }) {
  const pocket = usePocket();
  const setting = monthSettings(pocket.data, month);
  const weekly = pocket.data.mode === "weekly";
  const [amount, setAmount] = useState(String(weekly ? Math.round(setting.budget * 7 / monthDays(month)) : setting.budget));
  const [groceries, setGroceries] = useState(String(setting.groceries));
  const [weekStart, setWeekStart] = useState(pocket.data.weekStartsOn);
  const parsed = parseAmount(amount);
  const monthlyTotal = weekly ? Math.round(parsed * monthDays(month) / 7) : parsed;

  return <form className="flex flex-col gap-5 rounded-xl border border-black-020 bg-black-002 p-4" onSubmit={(event) => {
    event.preventDefault();
    if (monthlyTotal > 0 && monthlyTotal <= 100_000_000 && parseAmount(groceries) <= parsed) {
      pocket.saveMonthlyBudget(month, monthlyTotal, parseAmount(groceries), weekStart);
    }
  }}>
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="budget-amount" required>{weekly ? "주간 예산" : "월 총예산"}</FieldLabel>
      <TextField id="budget-amount" required inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
      <p className="font-numbers text-xl">{weekly ? "이 달 배정 합계" : "주별 편성 합계"} {formatMoney(monthlyTotal)}원</p>
    </div>
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="groceries">주 식비 배정 (식료품 포함)</FieldLabel>
      <TextField id="groceries" inputMode="numeric" value={groceries} onChange={(event) => setGroceries(event.target.value.replace(/\D/g, ""))} />
      <FieldHint>주 예산 안에서 배정합니다. 월간 설정에서는 주별 편성액에 반영됩니다.</FieldHint>
    </div>
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="week-start">주 시작 요일</FieldLabel>
      <SelectField id="week-start" value={weekStart} options={WEEKDAYS.map((day, index) => ({ value: String(index), label: day }))} onChange={(event) => setWeekStart(Number(event.target.value))} />
    </div>
    <FieldHint>{weekly ? "주당 금액을 입력합니다. 월초·월말의 짧은 주는 날짜 비율로 계산합니다." : "월 총액을 이 달의 주별로 나눕니다. 월초·월말의 짧은 주는 날짜 비율로 배정합니다."} 초과 지출은 다음 주 예산에서 차감합니다.</FieldHint>
    <PillButton type="submit" disabled={monthlyTotal <= 0 || monthlyTotal > 100_000_000 || parseAmount(groceries) > parsed}>{month} {weekly ? "주 예산" : "월 예산"} 저장</PillButton>
  </form>;
}

function BudgetView() {
  const pocket = usePocket();
  const [month, setMonth] = useState(pocket.today.slice(0, 7));
  const setting = monthSettings(pocket.data, month);
  return <div className="flex w-full min-w-0 max-w-content flex-col gap-5">
    <div className="flex flex-col gap-2 rounded-xl border border-black-020 bg-black-002 p-4"><FieldLabel htmlFor="budget-month" required>예산을 설정할 달</FieldLabel><TextField id="budget-month" type="month" value={month} onChange={(event) => { if (event.target.value) setMonth(event.target.value); }} /></div>
    <ScreenTitle title={pocket.data.mode === "weekly" ? "주간 예산" : "월간 예산"} subtitle={pocket.data.mode === "weekly" ? "주당 금액을 입력하세요" : "월 총액을 주별로 나눠 편성합니다"} />
    <BudgetForm key={`${month}-${pocket.data.mode}-${setting.budget}-${setting.groceries}`} month={month} />
  </div>;
}

export function BudgetPage() {
  const pocket = usePocket();
  return pocket.ready ? <BudgetView /> : <PageSkeleton />;
}
