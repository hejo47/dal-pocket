"use client";
import { useState } from "react";
import { usePocket } from "@/components/providers/pocket-provider";
import { FieldLabel, FieldHint, TextField, SelectField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";
import { monthSettings, monthDays } from "@/lib/finance";
import { formatMoney, parseAmount, WEEKDAYS } from "@/lib/pocket";
function Form({ month }: { month: string }) {
 const pocket = usePocket(); const setting = monthSettings(pocket.data, month);
 const [exactTotal,setExactTotal] = useState<number|null>(setting.budget); const [basis, setBasis] = useState("monthly"); const [amount, setAmount] = useState(String(setting.budget));
 const [groceries, setGroceries] = useState(String(setting.groceries)); const [weekStart, setWeekStart] = useState(pocket.data.weekStartsOn);
 const total = exactTotal ?? (basis === "weekly" ? Math.round(parseAmount(amount) * monthDays(month) / 7) : parseAmount(amount));
 return <form className="flex flex-col gap-5 rounded-xl border border-black-010 bg-black-002 p-4" onSubmit={(event) => { event.preventDefault(); if (total > 0 && total <= 100000000 && parseAmount(groceries) <= Math.ceil(total * 7 / monthDays(month))) pocket.saveMonthlyBudget(month, total, parseAmount(groceries), weekStart); }}>
 <div className="flex flex-col gap-2"><FieldLabel htmlFor="budget-basis">입력 기준</FieldLabel><SelectField id="budget-basis" value={basis} options={[{ value:"monthly", label:"월 총예산으로 설정" }, { value:"weekly", label:"주 평균 예산으로 설정" }]} onChange={(event) => { setExactTotal(total); setBasis(event.target.value); setAmount(String(event.target.value === "weekly" ? Math.round(total * 7 / monthDays(month)) : total)); }} /></div>
 <div className="flex flex-col gap-2"><FieldLabel htmlFor="budget-amount" required>{basis === "monthly" ? "월 총예산" : "주 평균 예산"}</FieldLabel><TextField id="budget-amount" required inputMode="numeric" value={amount} onChange={(event) => { setExactTotal(null); setAmount(event.target.value.replace(/\D/g,"")); }} /><p className="font-numbers text-xl">월 총액 {formatMoney(total)}원</p></div>
 <div className="flex flex-col gap-2"><FieldLabel htmlFor="groceries">주 예산 중 자취 식료품 예산</FieldLabel><TextField id="groceries" inputMode="numeric" value={groceries} onChange={(event) => setGroceries(event.target.value.replace(/\D/g,""))} /><FieldHint>주 평균 예산 이내에서 설정합니다. 전체 예산에 포함된 별도 배정액입니다. 짧은 주는 일수에 비례해 배분합니다.</FieldHint></div>
 <div className="flex flex-col gap-2"><FieldLabel htmlFor="week-start">주 시작 요일</FieldLabel><SelectField id="week-start" value={weekStart} options={WEEKDAYS.map((day,index) => ({ value:String(index),label:day }))} onChange={(event) => setWeekStart(Number(event.target.value))} /></div>
 <FieldHint>주간·월간 화면은 위 월 총액을 함께 사용합니다. 주별 배분 합계는 월 총액과 같고, 이전 주의 초과 지출은 다음 주 예산에서 차감됩니다. 다른 달은 따로 설정합니다.</FieldHint><PillButton type="submit" disabled={total <= 0 || total > 100000000 || parseAmount(groceries) > Math.ceil(total * 7 / monthDays(month))}>{month} 예산 저장</PillButton></form>;
}
function BudgetView() { const pocket = usePocket(); const [month,setMonth] = useState(pocket.today.slice(0,7)); return <div className="flex flex-col gap-5"><ScreenTitle title="월별 예산" subtitle="하나의 월 예산을 주간과 월간에서 함께 관리" /><div className="flex flex-col gap-2"><FieldLabel htmlFor="budget-month">예산을 설정할 달</FieldLabel><TextField id="budget-month" type="month" value={month} onChange={(event) => { if(event.target.value) setMonth(event.target.value); }} /></div><Form key={`${month}-${monthSettings(pocket.data,month).budget}-${monthSettings(pocket.data,month).groceries}`} month={month} /></div>; }

export function BudgetPage() { const pocket=usePocket(); return pocket.ready ? <BudgetView /> : <PageSkeleton />; }
