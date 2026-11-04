"use client";

import { IconLink } from "@/components/ui/icon-link";

import { PeriodPicker } from "@/components/ui/period-picker";

import { MoneyRow } from "@/components/ui/money-row";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, SquarePen, WalletCards } from "lucide-react";

import { usePocket } from "@/components/providers/pocket-provider";
import { IconContainer } from "@/components/ui/icon-container";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { cashFlow, financeSummary, monthDays } from "@/lib/finance";
import { formatMoney, getCategoryTotals, getPeriod, getPeriodExpenses, offsetDate, sumExpenses } from "@/lib/pocket";

export function AnalysisPage() {
  const pocket = usePocket();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  if (!pocket.ready) return <PageSkeleton />;
  const { data, today } = pocket;
  const currentMonth = today.slice(0, 7);
  const month = selectedMonth ?? currentMonth;
  const referenceDate = month === currentMonth ? today : `${month}-${monthDays(month)}`;
  const period = getPeriod("monthly", data.weekStartsOn, referenceDate);
  const expenses = getPeriodExpenses(data.expenses, period);
  const summary = financeSummary(data, period);
  const flow = cashFlow(data, month);
  const groups = getCategoryTotals(expenses);
  const previous = getPeriod("monthly", data.weekStartsOn, offsetDate(period.start, -1));
  const comparableEnd = offsetDate(previous.start, Math.min(period.elapsedDays, previous.totalDays) - 1);
  const previousExpenses = getPeriodExpenses(data.expenses, { start: previous.start, end: comparableEnd });
  const previousTotal = sumExpenses(previousExpenses);
  const change = summary.spent - previousTotal;
  return <div className="flex w-full max-w-content flex-col gap-7">
    <ScreenTitle title="지출 분석" subtitle={`${period.label} · 기록한 지출 기준`} />
    <PeriodPicker date={month + "-01"} maxDate={today} onChange={(date) => setSelectedMonth(date.slice(0, 7))} />
    <div className="flex items-center justify-between gap-3"><span className="text-sm leading-150 text-black-030">{period.scope} 지출</span><p className="font-numbers text-2xl leading-140">{formatMoney(summary.spent)}원</p></div>
    <div className="flex flex-col gap-2 rounded-xl border border-black-010 p-4 text-sm"><dl><MoneyRow label="일반 지출" amount={summary.regularSpent} /><MoneyRow label="고정 지출 · 별도" amount={summary.fixedSpent} /></dl><IconLink href={`/finance?month=${month}#fixed-costs`} label="고정 내역 관리" className="self-start"><SquarePen /></IconLink></div>
    <section className="flex flex-col gap-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold leading-150">카테고리별 지출</h2><span className="text-xs leading-150 text-black-030">항목 선택 시 내역 보기</span></div>
      {groups.length ? <div className="flex flex-col gap-5">{groups.map((group) => <Link key={group.category} href={{ pathname: "/expenses", query: { month, category: group.category } }} className="flex flex-col gap-2 rounded py-1" aria-label={`${group.category}, ${formatMoney(group.amount)}원, ${group.percent}%, 내역 보기`}><div className="flex items-center justify-between gap-2"><span className="text-sm leading-150">{group.category}</span><div className="flex items-center gap-2"><span className="font-numbers text-sm leading-150">{formatMoney(group.amount)}원 <span className="text-xs text-black-030">· {group.percent}%</span></span><IconContainer size="sm" className="text-black-030"><ChevronRight /></IconContainer></div></div><div className="flex h-1.5 overflow-hidden rounded-full bg-black-002"><span className="bg-black-100" style={{ width: `${group.percent}%` }} /></div></Link>)}</div> : <p className="py-8 text-sm leading-160 text-black-030">이 기간에 기록한 지출이 없습니다.</p>}
    </section>
    {groups[0] && <div className="flex flex-col gap-2 rounded-lg bg-black-002 p-4"><h2 className="text-sm leading-150">가장 많이 쓴 항목: {groups[0].category}</h2><p className="font-numbers text-xs leading-160 text-black-030">{formatMoney(groups[0].amount)}원 · 전체 지출의 {groups[0].percent}%</p></div>}
    <dl className="flex gap-6 border-t border-black-010 pt-5"><div className="flex flex-1 flex-col gap-1"><dt className="text-xs leading-150 text-black-030">하루 평균 · {period.elapsedDays}일 기준</dt><dd className="font-numbers text-lg leading-150">{formatMoney(summary.dailyAverage)}원</dd></div><div className="flex flex-1 flex-col gap-1"><dt className="text-xs leading-150 text-black-030">기록한 지출</dt><dd className="font-numbers text-lg leading-150">{expenses.length}건</dd></div></dl>
    <section className="flex flex-col gap-2 border-t border-black-010 pt-5"><h2 className="text-sm leading-150">지난달 같은 기간과 비교</h2>{previousExpenses.length ? <p className="text-xs leading-160 text-black-030">이전 기간보다 <span className="font-numbers">{formatMoney(Math.abs(change))}원</span> {change > 0 ? "더 썼습니다." : change < 0 ? "덜 썼습니다." : "차이가 없습니다."}</p> : <p className="text-xs leading-160 text-black-030">비교할 기록이 쌓이면 표시됩니다.</p>}</section>
    <section aria-label="카드와 현금 흐름" className="flex flex-col gap-3 rounded-xl border border-black-010 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{Number(month.slice(5))}월 카드·현금 흐름</h2>
        <IconLink href={`/finance?month=${month}`} label="현금 흐름 보기"><WalletCards /></IconLink>
      </div>
      <dl>
        <MoneyRow label="카드값 · 받은 정산 차감" amount={flow.cardBill} />
        <MoneyRow label="카드 출금 합계" amount={flow.dueThisMonth} />
        <MoneyRow label="이달 할부" amount={flow.installmentMonth} />
        <MoneyRow label="이달 저축" amount={flow.savedMonth} />
        <MoneyRow label="미수 정산" amount={flow.receivable} />
        <MoneyRow label="월말 예상 잔액" amount={flow.balance} />
      </dl>
      <p className="text-xs leading-160 text-black-030">카드값은 선택한 달의 출금 기준이에요. 카드 출금 합계에는 정산 차감 전 결제액과 카드 고정비가 들어가고, 할부는 별도로 표시해요.</p>
    </section>
  </div>;
}
