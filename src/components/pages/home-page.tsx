"use client";

import { IconLink } from "@/components/ui/icon-link";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IconContainer } from "@/components/ui/icon-container";
import { PeriodPicker } from "@/components/ui/period-picker";

import { MoneyRow } from "@/components/ui/money-row";

import { useState } from "react";
import { CalendarPlus, Info, SquarePen } from "lucide-react";

import { SignInNotice } from "@/components/ui/sign-in-notice";
import { HomePlans } from "@/components/pages/home-plans";
import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";
import { PillButton } from "@/components/ui/pill-button";

import { dailySpendingAllowance, financeSummary, foodBudgetSummary } from "@/lib/finance";
import { formatMoney, getPeriod, getPeriodExpenses, sumExpenses } from "@/lib/pocket";

export function HomePage({ masked = false, checkingAuth = false }: { masked?: boolean; checkingAuth?: boolean } = {}) {
  const pocket = usePocket();
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [visibleExpenses, setVisibleExpenses] = useState({ period: "", count: 8 });
  if (!pocket.ready) return <PageSkeleton />;
  const { data, today, dailyView } = pocket;
  const selectedDate = viewDate ?? today;
  const budgetHref = masked ? "/account" : `/budget?month=${selectedDate.slice(0, 7)}`;
  const editBudget = <IconLink href={budgetHref} label="예산 수정"><SquarePen /></IconLink>;
  const period = getPeriod(dailyView ? "weekly" : data.mode, data.weekStartsOn, selectedDate);
  const summary = financeSummary(data, period);
  const month = selectedDate.slice(0, 7);
  const selectedMonth = Number(month.slice(5));
  const day = { start: selectedDate, end: selectedDate };
  const dayExpenses = dailyView ? getPeriodExpenses(data.expenses, day) : [];
  const daily = dailyView ? dailySpendingAllowance(data, selectedDate) : null;
  const reserved = daily ? daily.reserved : summary.reserved;
  const budget = summary.budget;
  const spent = dailyView ? sumExpenses(dayExpenses) : summary.spent;
  const remaining = daily ? daily.available : summary.remaining;
  const usedPercent = summary.usedPercent;
  const food = foodBudgetSummary(data, period);
  const dailyBudget = Math.max(0, Math.floor(summary.remaining / period.remainingDays));
  const periodExpenses = dailyView ? dayExpenses : getPeriodExpenses(data.expenses, period);
  const periodKey = dailyView ? selectedDate : period.start + ":" + period.end;
  const visibleCount = visibleExpenses.period === periodKey ? visibleExpenses.count : 8;
  const selectedDay = Number(selectedDate.slice(8, 10));
  const amountText = (amount: number) => masked ? "??" : formatMoney(amount);
  const budgetTitle = dailyView
    ? `${selectedMonth}월 ${selectedDay}일 예산`
    : data.mode === "weekly"
      ? `${selectedMonth}월 ${period.weekNumber}주차 예산`
      : `${selectedMonth}월 예산`;

  return <div className="flex w-full max-w-content flex-col gap-7">
    <ScreenTitle title={budgetTitle} action={editBudget} />
    <PeriodPicker mode={dailyView ? "daily" : data.mode} date={selectedDate} maxDate={today} weekStartsOn={data.weekStartsOn} onChange={(date) => setViewDate(date.slice(0, 7) === today.slice(0, 7) && !dailyView && data.mode === "monthly" ? null : date)} />
    <section aria-label="예산 현황" className="flex flex-col gap-5 border-b border-black-010 pb-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <p className="text-sm leading-150 text-black-030">{daily ? (selectedDate === today ? "오늘 더 쓸 수 있는 금액" : "이날 더 쓸 수 있었던 금액") : !masked && remaining < 0 ? "예산 초과 금액" : "남은 예산"}</p>
          <Dialog>
            <DialogTrigger asChild>
              <PillButton type="button" variant="ghost" size="icon" className="px-1 py-1 text-black-030" aria-label="예산 계산 기준">
                <IconContainer size="sm"><Info /></IconContainer>
              </PillButton>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined}>
              <DialogHeader><DialogTitle>예산 계산 기준</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-2 text-sm leading-160 text-black-030">
          {daily ? (
            <p>주 예산 잔액 {amountText(daily.remaining)}원에서 남은 약속 비용 {amountText(daily.reserved)}원을 빼고, 선택한 날을 포함한 {daily.days}일로 나눈 금액이에요.</p>
          ) : <>
            <p>배정 예산에서 사용액을 빼면 남은 예산이에요. 배정 예산의 {masked ? "??" : usedPercent}%를 썼어요.</p>
            <p>하루 사용 가능액 {amountText(dailyBudget)}원 · 선택한 날 포함 {period.remainingDays}일 기준</p>
            {!masked && summary.reserved > 0 && <p>약속 비용을 확보한 뒤 하루 사용 가능액은 {formatMoney(summary.dailyAvailable)}원이에요.</p>}
          </>}
        </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="font-numbers break-all text-4xl font-semibold leading-130 text-black-100">{amountText(Math.abs(remaining))}<span className="text-xl font-medium">원</span></p>
      </div>
      {!masked && !dailyView && data.mode === "weekly" && (
        <p className="text-xs leading-150 text-black-030">
          {summary.carriedIn || summary.carried
            ? `이전 주 이월 +${formatMoney(summary.carriedIn)}원 · 차감 −${formatMoney(summary.carried)}원`
            : "이전 주 이월/차감 없음"}
        </p>
      )}
      {!masked && budget > 0 && remaining >= 0 && remaining <= 1000 && (
        <p className="rounded-lg bg-black-002 px-3 py-2 text-sm leading-150">이 금액이면 그냥 아껴라</p>
      )}
      {!dailyView && data.mode === "weekly" && <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm leading-150">하루 사용 가능액</p>
          <p className="font-numbers ml-auto break-all text-2xl font-semibold leading-140">{amountText(summary.dailyAvailable)}<span className="text-sm font-medium">원</span></p>
        </div>
        <p className="text-xs leading-150 text-black-030">남은 약속 비용 제외 · {period.remainingDays}일 기준</p>
      </div>}
      <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-black-002 p-4">
        <dl className="flex flex-wrap gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <dt className="text-xs leading-150 text-black-030">사용한 금액</dt>
            <dd className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{amountText(spent)}<span className="text-sm">원</span></dd>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <dt className="text-xs leading-150 text-black-030">{daily ? "주 예산 잔액" : data.mode === "weekly" ? "주간 예산" : "월간 예산"}</dt>
            <dd className="font-numbers break-all text-xl font-semibold leading-140 text-black-100">{amountText(daily ? daily.remaining : budget)}<span className="text-sm">원</span></dd>
          </div>
        </dl>
        {!masked && <div className="border-t border-black-010 pt-3"><HomePlans key={selectedDate} date={selectedDate} amount={reserved} /></div>}
      </div>
      {masked && <SignInNotice checking={checkingAuth}>로그인하면 내 금액과 지출 내역을 볼 수 있어요.</SignInNotice>}
    </section>
    <section className="flex flex-col gap-2"><div className="flex items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold leading-150">{dailyView ? `${selectedMonth}월 ${selectedDay}일` : data.mode === "weekly" ? `${selectedMonth}월 ${period.weekNumber}주차` : `${selectedMonth}월`} 지출</h2><span className="font-numbers text-xs leading-150 text-black-030">{amountText(sumExpenses(periodExpenses))}원 · 전체 {masked ? "??" : periodExpenses.length}건</span></div><IconLink href={masked ? "/account" : "/expenses"} label="내역 관리"><CalendarPlus /></IconLink></div>{masked ? <div className="rounded-xl border border-black-010 bg-black-002 px-3 py-4 text-sm text-black-030">로그인 후 내역을 볼 수 있어요.</div> : <ExpenseList expenses={periodExpenses.slice(0, visibleCount)} grouped />}{!masked && visibleCount < periodExpenses.length && <PillButton variant="outline" className="w-full" onClick={() => setVisibleExpenses({ period: periodKey, count: visibleCount + 8 })}>더보기 · {Math.min(visibleCount, periodExpenses.length)}/{periodExpenses.length}건</PillButton>}</section>
    <section aria-label="식비 예산" className="flex flex-col gap-3 rounded-xl border border-black-010 p-4"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{dailyView ? "선택한 주의 식비" : "식비"}</h2><IconLink href={budgetHref} label="식비 설정"><SquarePen /></IconLink></div>{masked ? <div className="flex flex-col gap-1 rounded-lg bg-black-002 p-4"><p className="text-sm text-black-030">남은 식비</p><p className="font-numbers text-2xl font-semibold">??원</p></div> : food.configured ? <><div className="flex flex-col gap-1 rounded-lg bg-black-002 p-4"><p className="text-sm text-black-030">{food.remaining < 0 ? "식비 초과" : "남은 식비"}</p><p className="font-numbers break-all text-2xl font-semibold leading-140">{formatMoney(Math.abs(food.remaining))}<span className="text-sm">원</span></p></div><dl><MoneyRow label="배정 식비" amount={food.budget} /><MoneyRow label="사용한 식비" amount={food.spent} /></dl>{food.carriedIn > 0 && <p className="text-xs leading-160 text-black-030">이전 주에 남긴 {formatMoney(food.carriedIn)}원을 더한 예산입니다.</p>}{food.carried > 0 && <p className="text-xs leading-160 text-black-030">이전 주에서 끌어 쓴 {formatMoney(food.carried)}원을 차감한 예산입니다.</p>}{food.nextPeriod && <div className="flex flex-col gap-2 border-t border-black-010 pt-3"><dl><MoneyRow label="다음 주 예상 식비" amount={food.nextBudget ?? 0} /></dl><p className="text-sm leading-160 text-black-030">(기본 {formatMoney(food.nextBase ?? 0)}원{food.nextAdjustment !== 0 ? " · " + (food.nextAdjustment > 0 ? "미사용액 " : "초과분 ") + formatMoney(Math.abs(food.nextAdjustment)) + (food.nextAdjustment > 0 ? "원 가산" : "원 차감") : ""})</p><p className="text-xs leading-160 text-black-030">이번 주 남은 금액 기준이며, 추가 지출에 따라 바뀝니다.</p>{food.borrowed > 0 && <p className="text-xs leading-160 text-black-030">이번 주 초과분 {formatMoney(food.borrowed)}원을 다음 주 식비에서 자동으로 끌어 씁니다.</p>}</div>}{!food.nextPeriod && food.borrowed > 0 && <p className="text-xs text-black-030">이 기간 식비 초과 {formatMoney(food.borrowed)}원</p>}<p className="text-xs leading-160 text-black-030">식비 분류와 자취 식료품으로 체크한 기록을 합산합니다.</p></> : <p className="text-sm text-black-030">예산 설정에서 주 식비를 배정해주세요.</p>}</section>
  </div>;
}
