"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { usePocket } from "@/components/providers/pocket-provider";
import { ActionButtonRow } from "@/components/ui/action-button-row";
import { FieldError, FieldHint, FieldLabel, SelectField, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { formatMoney, getPeriod, getPeriodExpenses, parseAmount, sumExpenses, validAmount, WEEKDAYS } from "@/lib/pocket";

function BudgetForm() {
  const pocket = usePocket();
  const router = useRouter();
  const [amount, setAmount] = useState(String(pocket.data.budgets[pocket.data.mode]));
  const [weekStart, setWeekStart] = useState(pocket.data.weekStartsOn);
  const [error, setError] = useState("");
  const weekly = pocket.data.mode === "weekly";
  const period = getPeriod(pocket.data.mode, weekStart, pocket.today);
  const spent = sumExpenses(getPeriodExpenses(pocket.data.expenses, period));
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (!validAmount(parsed)) { setError("예산을 1원부터 1억 원까지 입력해주세요."); return; }
    pocket.saveBudget(parsed, weekStart);
    router.push("/");
  }
  return <form onSubmit={submit} className="flex flex-col gap-6">
    <div className="flex flex-col gap-4 rounded-lg border border-black-010 p-4"><div className="flex flex-col gap-2"><FieldLabel htmlFor="budget-amount" required>{weekly ? "매주 예산" : "매월 예산"}</FieldLabel><div className="flex items-center gap-2"><TextField id="budget-amount" required inputMode="numeric" autoComplete="off" className="font-numbers border-0 px-0 py-0 text-3xl" placeholder="0" value={amount ? formatMoney(parseAmount(amount)) : ""} onChange={(event) => { setAmount(event.target.value.replace(/\D/g, "").slice(0, 9)); setError(""); }} /><span className="text-sm leading-150 text-black-030">원</span></div></div><div className="flex gap-2">{(weekly ? [100000, 150000, 250000] : [300000, 500000, 700000]).map((preset) => <PillButton key={preset} variant="outline" size="sm" className="flex-1" onClick={() => { setAmount(String(preset)); setError(""); }}>{preset / 10000}만 원</PillButton>)}</div></div>
    {weekly && <div className="flex flex-col gap-2"><FieldLabel htmlFor="budget-week-start">주 시작 요일</FieldLabel><SelectField id="budget-week-start" value={weekStart} options={WEEKDAYS.map((day, value) => ({ value: String(value), label: day }))} onChange={(event) => setWeekStart(Number(event.target.value))} /></div>}
    <dl className="flex flex-col"><div className="flex items-center justify-between gap-4 border-b border-black-010 py-4"><dt className="text-sm leading-150 text-black-030">{weekly ? "이번 주" : "이번 달"} 적용 기간</dt><dd className="font-numbers text-sm leading-150">{period.label}</dd></div><div className="flex items-center justify-between gap-4 border-b border-black-010 py-4"><dt className="text-sm leading-150 text-black-030">기간 내 사용 금액</dt><dd className="font-numbers text-sm leading-150">{formatMoney(spent)}원</dd></div></dl>
    <FieldHint>{weekly ? "선택한 요일부터 7일간 같은 예산이 적용됩니다. 주간 예산과 월간 예산은 각각 저장됩니다." : "매월 1일부터 말일까지 같은 예산이 적용됩니다."} 저장하면 남은 예산과 하루 사용 가능액에 반영됩니다.</FieldHint>
    {pocket.data.isDemo && <FieldHint>예산을 저장하면 예시 내역을 비우고 내 기록을 시작합니다.</FieldHint>}
    <FieldError>{error}</FieldError><ActionButtonRow buttons={[{ label: `${weekly ? "주간" : "월간"} 예산 저장`, type: "submit" }]} />
  </form>;
}

export function BudgetPage() {
  const pocket = usePocket();
  if (!pocket.ready) return <PageSkeleton />;
  return <div className="flex w-full max-w-content flex-col gap-6"><ScreenTitle title="예산 설정" subtitle={pocket.data.mode === "weekly" ? "주 단위 관리" : "월 단위 관리"} /><BudgetForm key={`${pocket.data.mode}-${pocket.data.weekStartsOn}-${pocket.data.budgets[pocket.data.mode]}`} /></div>;
}
