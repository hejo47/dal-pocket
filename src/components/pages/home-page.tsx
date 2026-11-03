"use client";

import { PeriodPicker } from "@/components/ui/period-picker";

import { MoneyRow } from "@/components/ui/money-row";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";
import { PillButton } from "@/components/ui/pill-button";
import { IconContainer } from "@/components/ui/icon-container";

import { cashFlow, financeSummary, foodBudgetSummary } from "@/lib/finance";
import { formatMoney, getPeriod, getPeriodExpenses, shortDate, sumExpenses } from "@/lib/pocket";

export function HomePage() {
  const pocket = usePocket();
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [visibleExpenses, setVisibleExpenses] = useState({ period: "", count: 8 });
  if (!pocket.ready) return <PageSkeleton />;
  const { data, today } = pocket;
  const selectedDate = viewDate ?? today;
  const period = getPeriod(data.mode, data.weekStartsOn, selectedDate);
  const summary = financeSummary(data, period);
  const { cardBill, dueThisMonth } = cashFlow(data, selectedDate.slice(0, 7));
  const food = foodBudgetSummary(data, period);
  const dailyBudget = Math.max(0, Math.floor(summary.remaining / period.remainingDays));
  const periodExpenses = getPeriodExpenses(data.expenses, period);
  const periodKey = period.start + ":" + period.end;
  const visibleCount = visibleExpenses.period === periodKey ? visibleExpenses.count : 8;
  const periodLabel = `${Number(period.start.slice(5, 7))}월 ${period.weekNumber}주`;
  return <div className="flex w-full max-w-content flex-col gap-7">
    <ScreenTitle title={data.mode === "weekly" ? `${periodLabel} 예산` : `${Number(selectedDate.slice(5, 7))}월 예산`} subtitle={`${shortDate(period.start)}–${shortDate(period.end)}`} action={<Link href="/budget" className="rounded-lg border border-black-020 bg-white px-3 py-2 text-xs leading-150">예산 수정</Link>} />
    <PeriodPicker mode={data.mode} date={selectedDate} maxDate={today} weekStartsOn={data.weekStartsOn} onChange={(date) => setViewDate(date.slice(0, 7) === today.slice(0, 7) && data.mode === "monthly" ? null : date)} />
    <section aria-label="예산 현황" className="flex flex-col gap-5 border-b border-black-010 pb-6">
      <div className="flex flex-col gap-1"><p className="text-sm leading-150 text-black-030">{summary.remaining < 0 ? "예산 초과 금액" : "남은 예산"}</p><p className="font-numbers break-all text-4xl leading-130">{formatMoney(Math.abs(summary.remaining))}<span className="text-xl">원</span></p></div>
      <div className="flex flex-col gap-2"><div role="progressbar" aria-label="예산 사용률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, summary.usedPercent)} aria-valuetext={`${summary.usedPercent}% 사용`} className="flex h-1.5 overflow-hidden rounded-full bg-black-002"><span className="bg-black-100 transition-all" style={{ width: `${Math.min(100, summary.usedPercent)}%` }} /></div><div className="flex items-center justify-between gap-3 text-xs leading-150 text-black-030"><span>예산의 {summary.usedPercent}% 사용</span><span>{period.label}</span></div></div>
      <dl className="flex flex-wrap gap-3"><div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-black-002 px-4 py-4"><dt className="text-xs leading-150 text-black-030">사용한 금액</dt><dd className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{formatMoney(summary.spent)}<span className="text-sm">원</span></dd></div><div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg bg-black-002 px-4 py-4"><dt className="text-xs leading-150 text-black-030">{data.mode === "weekly" ? "주간" : "월간"} 예산</dt><dd className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{formatMoney(summary.budget)}<span className="text-sm">원</span></dd></div></dl>
    </section>
    <section aria-label="하루 사용 가능액" className="flex flex-col gap-4 rounded-xl border border-black-020 p-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-sm leading-150">하루 사용 가능액</h2><p className="font-numbers text-xl font-semibold leading-140">{formatMoney(dailyBudget)}원</p></div>
      <p className="font-numbers text-xs leading-160 text-black-030">남은 예산 {formatMoney(summary.remaining)}원 ÷ {selectedDate === today ? "오늘 포함 " : "선택일 포함 "}{period.remainingDays}일</p>
      {summary.reserved > 0 && <div className="flex flex-col gap-2 border-t border-black-010 pt-3"><div className="flex items-center justify-between gap-3 text-sm"><p>약속 비용 확보 후 하루 금액</p><p className="font-numbers font-semibold">{formatMoney(summary.dailyAvailable)}원</p></div><p className="font-numbers text-xs leading-160 text-black-030">약속 {formatMoney(summary.reserved)}원을 제외한 {formatMoney(Math.max(0, summary.remaining - summary.reserved))}원 ÷ {period.remainingDays}일</p></div>}
    </section>
    <section aria-label="지출과 예산 조정" className="flex flex-col gap-4 rounded-xl border border-black-010 p-4">
      <h2 className="text-base font-semibold">지출과 예산 조정</h2>
      <dl><MoneyRow label="일반 지출" amount={summary.regularSpent} /><MoneyRow label="고정 지출 · 생활 예산과 별도" amount={summary.fixedSpent} /><MoneyRow label="카드값 · 받은 정산 차감" amount={cardBill} /><MoneyRow label="카드 출금 합계" amount={dueThisMonth} /><MoneyRow label="약속 확보액" amount={summary.reserved} /></dl>
      <p className="text-xs leading-160 text-black-030">{Number(selectedDate.slice(5, 7))}월 출금 기준이에요. 카드 출금 합계에는 정산 차감 전 결제액과 카드 고정비가 들어가요.</p>
      <details className="rounded-lg bg-black-002 px-3 py-2"><summary className="cursor-pointer py-1 text-sm font-semibold">이전 주 이월·차감</summary><dl><MoneyRow label="미사용액 가산" amount={summary.carriedIn} /><MoneyRow label="초과 지출 차감" amount={summary.carried} /></dl></details>
      <Link href={{ pathname: "/finance", query: { month: selectedDate.slice(0, 7) } }} className="flex items-center justify-between gap-3 rounded-lg bg-black-100 px-4 py-3 text-sm font-semibold text-white"><span>현금 흐름 관리</span><IconContainer size="sm"><ChevronRight /></IconContainer></Link>
    </section>
    <section aria-label="식비 예산" className="flex flex-col gap-3 rounded-xl border border-black-020 p-4"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">식비</h2><Link href="/budget" className="rounded-xl border border-black-020 bg-black-002 px-3 py-2 text-xs">식비 설정</Link></div>{food.configured ? <><div className="flex flex-col gap-1 rounded-lg bg-black-002 p-4"><p className="text-sm text-black-030">{food.remaining < 0 ? "식비 초과" : "남은 식비"}</p><p className="font-numbers break-all text-2xl font-semibold leading-140">{formatMoney(Math.abs(food.remaining))}<span className="text-sm">원</span></p></div><dl><MoneyRow label="배정 식비" amount={food.budget} /><MoneyRow label="사용한 식비" amount={food.spent} /></dl>{food.carriedIn > 0 && <p className="text-xs leading-160 text-black-030">이전 주에 남긴 {formatMoney(food.carriedIn)}원을 더한 예산입니다.</p>}{food.carried > 0 && <p className="text-xs leading-160 text-black-030">이전 주에서 끌어 쓴 {formatMoney(food.carried)}원을 차감한 예산입니다.</p>}{food.nextPeriod && <div className="flex flex-col gap-2 border-t border-black-010 pt-3"><dl><MoneyRow label="다음 주 예상 식비" amount={food.nextBudget ?? 0} /></dl><p className="text-sm leading-160 text-black-030">(기본 {formatMoney(food.nextBase ?? 0)}원{food.nextAdjustment !== 0 ? " · " + (food.nextAdjustment > 0 ? "미사용액 " : "초과분 ") + formatMoney(Math.abs(food.nextAdjustment)) + (food.nextAdjustment > 0 ? "원 가산" : "원 차감") : ""})</p><p className="text-xs leading-160 text-black-030">이번 주 남은 금액 기준이며, 추가 지출에 따라 바뀝니다.</p>{food.borrowed > 0 && <p className="text-xs leading-160 text-black-030">이번 주 초과분 {formatMoney(food.borrowed)}원을 다음 주 식비에서 자동으로 끌어 씁니다.</p>}</div>}{!food.nextPeriod && food.borrowed > 0 && <p className="text-xs text-black-030">이 기간 식비 초과 {formatMoney(food.borrowed)}원</p>}<p className="text-xs leading-160 text-black-030">식비 분류와 자취 식료품으로 체크한 기록을 합산합니다.</p></> : <p className="text-sm text-black-030">예산 설정에서 주 식비를 배정해주세요.</p>}</section>
    <section className="flex flex-col gap-2"><div className="flex items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold leading-150">{period.label} 지출</h2><span className="font-numbers text-xs leading-150 text-black-030">{formatMoney(sumExpenses(periodExpenses))}원 · 전체 {periodExpenses.length}건</span></div><Link href="/expenses" className="rounded-lg border border-black-020 bg-white px-3 py-2 text-xs">내역 관리</Link></div><ExpenseList expenses={periodExpenses.slice(0, visibleCount)} grouped />{visibleCount < periodExpenses.length && <PillButton variant="outline" className="w-full" onClick={() => setVisibleExpenses({ period: periodKey, count: visibleCount + 8 })}>더보기 · {Math.min(visibleCount, periodExpenses.length)}/{periodExpenses.length}건</PillButton>}</section>
  </div>;
}
