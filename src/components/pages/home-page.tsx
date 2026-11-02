"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";
import { PillButton } from "@/components/ui/pill-button";
import { IconContainer } from "@/components/ui/icon-container";

import { financeOf, financeSummary, monthSettings } from "@/lib/finance";
import { formatMoney, getPeriod, getPeriodExpenses, offsetDate, shortDate, sumExpenses } from "@/lib/pocket";

export function HomePage() {
  const pocket = usePocket();
  const [viewDate, setViewDate] = useState<string | null>(null);
  if (!pocket.ready) return <PageSkeleton />;
  const { data, today } = pocket;
  const selectedDate = viewDate ?? today;
  const period = getPeriod(data.mode, data.weekStartsOn, selectedDate);
  const summary = financeSummary(data, period);
  const periodExpenses = getPeriodExpenses(data.expenses, period);
  const periodLabel = `${Number(period.start.slice(5, 7))}월 ${period.weekNumber}주`;
  return <div className="flex w-full max-w-content flex-col gap-7">
    <ScreenTitle title={data.mode === "weekly" ? `${periodLabel} 예산` : `${Number(selectedDate.slice(5, 7))}월 예산`} subtitle={`${shortDate(period.start)}–${shortDate(period.end)}`} action={<Link href="/budget" className="rounded-lg border border-black-020 bg-white px-3 py-2 text-xs leading-150">예산 수정</Link>} />
    <div className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-black-020 bg-black-002 p-2"><PillButton variant="outline" size="icon" aria-label={data.mode === "weekly" ? "이전 주" : "이전 달"} onClick={() => setViewDate(offsetDate(period.start, -1))}><IconContainer><ChevronLeft /></IconContainer></PillButton><div className="flex min-w-0 flex-1 flex-col gap-1"><label htmlFor="home-period-date" className="text-center text-xs leading-150 text-black-030">{data.mode === "weekly" ? "조회할 주" : "조회할 달"}</label><input id="home-period-date" aria-label="홈에서 조회할 날짜" type="date" max={today} value={selectedDate} onChange={(event) => { if (event.target.value) setViewDate(event.target.value); }} className="block w-full min-w-0 max-w-full box-border rounded-lg border border-black-020 bg-white px-2 py-2 text-left text-sm" /></div><PillButton variant="outline" size="icon" aria-label={data.mode === "weekly" ? "다음 주" : "다음 달"} disabled={period.end >= today} onClick={() => setViewDate(offsetDate(period.end, 1))}><IconContainer><ChevronRight /></IconContainer></PillButton></div>
    <div className="flex flex-col gap-2 rounded-xl border border-black-010 bg-black-002 p-4 text-sm"><p>이전 주 초과 지출 차감: {formatMoney(summary.carried)}원</p><p>이번 기간 약속 확보액: {formatMoney(summary.reserved)}원</p><p>식료품 배정액: {formatMoney(Math.floor(monthSettings(data,period.start.slice(0,7)).groceries * period.totalDays / 7))}원 · 사용 {formatMoney(periodExpenses.filter((expense) => financeOf(data).payments[expense.id]?.groceries).reduce((sum,expense)=>sum+expense.amount,0))}원 (전체 예산에 포함)</p><Link href="/finance" className="self-start rounded-lg border border-black-100 bg-white px-3 py-2">수입·할부·약속·현금 잔액 관리 →</Link></div>
    <section aria-label="예산 현황" className="flex flex-col gap-5 border-b border-black-010 pb-6">
      <div className="flex flex-col gap-1"><p className="text-sm leading-150 text-black-030">{summary.remaining < 0 ? "예산 초과 금액" : "남은 예산"}</p><p className="font-numbers break-all text-4xl leading-130">{formatMoney(Math.abs(summary.remaining))}<span className="text-xl">원</span></p></div>
      <div className="flex flex-col gap-2"><div role="progressbar" aria-label="예산 사용률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, summary.usedPercent)} aria-valuetext={`${summary.usedPercent}% 사용`} className="flex h-1.5 overflow-hidden rounded-full bg-black-002"><span className="bg-black-100 transition-all" style={{ width: `${Math.min(100, summary.usedPercent)}%` }} /></div><div className="flex items-center justify-between gap-3 text-xs leading-150 text-black-030"><span>예산의 {summary.usedPercent}% 사용</span><span>{period.label}</span></div></div>
      <dl className="flex flex-wrap gap-3"><div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-black-002 px-4 py-4"><dt className="text-xs leading-150 text-black-030">사용한 금액</dt><dd className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{formatMoney(summary.spent)}<span className="text-sm">원</span></dd></div><div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-black-002 px-4 py-4"><dt className="text-xs leading-150 text-black-030">{data.mode === "weekly" ? "주간" : "월간"} 예산</dt><dd className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{formatMoney(summary.budget)}<span className="text-sm">원</span></dd></div></dl>
    </section>
    <section aria-label="하루 사용 가능액" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black-010 px-4 py-4"><div className="flex flex-col gap-1"><h2 className="text-sm leading-150">하루 사용 가능액</h2><p className="text-xs leading-150 text-black-030">{selectedDate === today ? "오늘 포함 " : `${period.label} · 남은 `}{period.remainingDays}일 · 참고 금액</p></div><p className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{formatMoney(summary.dailyAvailable)}<span className="text-sm">원</span></p></section>
    <section className="flex flex-col gap-2"><div className="flex items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold leading-150">{period.label} 지출</h2><span className="font-numbers text-xs leading-150 text-black-030">{formatMoney(sumExpenses(periodExpenses))}원</span></div><Link href="/expenses" className="rounded-lg border border-black-020 bg-white px-3 py-2 text-xs">전체 내역</Link></div><ExpenseList expenses={periodExpenses.slice(0, 8)} grouped /></section>
  </div>;
}
