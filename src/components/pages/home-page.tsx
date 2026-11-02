"use client";

import Link from "next/link";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { formatMoney, shortDate, sumExpenses } from "@/lib/pocket";

export function HomePage() {
  const pocket = usePocket();
  if (!pocket.ready) return <PageSkeleton />;
  const { data, period, summary, today } = pocket;
  const todaysExpenses = pocket.expenses.filter((expense) => expense.date === today);
  return <div className="flex w-full max-w-content flex-col gap-7">
    <ScreenTitle title={data.mode === "weekly" ? "이번 주 예산" : `${Number(today.slice(5, 7))}월 예산`} subtitle={`${shortDate(today)} 기준`} action={<Link href="/budget" className="py-2 text-xs leading-150 underline underline-offset-4">예산 수정</Link>} />
    <section aria-label="예산 현황" className="flex flex-col gap-5 border-b border-black-010 pb-6">
      <div className="flex flex-col gap-1"><p className="text-sm leading-150 text-black-030">{summary.remaining < 0 ? "예산 초과 금액" : "남은 예산"}</p><p className="font-numbers break-all text-4xl leading-130">{formatMoney(Math.abs(summary.remaining))}<span className="text-xl">원</span></p></div>
      <div className="flex flex-col gap-2"><div role="progressbar" aria-label="예산 사용률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, summary.usedPercent)} aria-valuetext={`${summary.usedPercent}% 사용`} className="flex h-1.5 overflow-hidden rounded-full bg-black-002"><span className="bg-black-100 transition-all" style={{ width: `${Math.min(100, summary.usedPercent)}%` }} /></div><div className="flex items-center justify-between gap-3 text-xs leading-150 text-black-030"><span>예산의 {summary.usedPercent}% 사용</span><span>{period.label}</span></div></div>
      <dl className="flex flex-wrap gap-3"><div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-black-002 px-4 py-4"><dt className="text-xs leading-150 text-black-030">사용한 금액</dt><dd className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{formatMoney(summary.spent)}<span className="text-sm">원</span></dd></div><div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-black-002 px-4 py-4"><dt className="text-xs leading-150 text-black-030">{data.mode === "weekly" ? "주간" : "월간"} 예산</dt><dd className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{formatMoney(data.budgets[data.mode])}<span className="text-sm">원</span></dd></div></dl>
    </section>
    <section aria-label="하루 사용 가능액" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black-010 px-4 py-4"><div className="flex flex-col gap-1"><h2 className="text-sm leading-150">하루 사용 가능액</h2><p className="text-xs leading-150 text-black-030">오늘 포함 {period.remainingDays}일 · 참고 금액</p></div><p className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{formatMoney(summary.dailyAvailable)}<span className="text-sm">원</span></p></section>
    <section className="flex flex-col gap-2"><div className="flex items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold leading-150">오늘 지출</h2><span className="font-numbers text-xs leading-150 text-black-030">{formatMoney(sumExpenses(todaysExpenses))}원</span></div><Link href="/expenses" className="py-2 text-xs leading-150 underline underline-offset-4">전체 내역</Link></div><ExpenseList expenses={todaysExpenses.slice(0, 3)} /></section>
  </div>;
}
