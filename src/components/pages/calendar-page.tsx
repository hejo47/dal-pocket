"use client";

import { PeriodPicker } from "@/components/ui/period-picker";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { formatMoney, getCalendarMonth, shortDate, sumExpenses, WEEKDAYS } from "@/lib/pocket";
import { allocatedBudget, financeOf } from "@/lib/finance";
import { cn } from "@/lib/utils";

const compactMoney = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });

function CalendarView() {
  const pocket = usePocket();
  const [month, setMonth] = useState(pocket.today.slice(0, 7));
  const [selected, setSelected] = useState(pocket.today);
  const calendar = getCalendarMonth(month, pocket.data.weekStartsOn, pocket.data.expenses);
  const selectedExpenses = pocket.data.expenses.filter((expense) => expense.date === selected);
  const weekdays = Array.from({ length: 7 }, (_, index) => WEEKDAYS[(pocket.data.weekStartsOn + index) % 7]);
  const monthLabel = `${Number(month.slice(0, 4))}년 ${Number(month.slice(5, 7))}월`;
  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title="소비 달력" subtitle="매월 1일부터 말일까지의 전체 지출" action={<PillButton variant="outline" size="sm" onClick={() => { setMonth(pocket.today.slice(0, 7)); setSelected(pocket.today); }}>오늘</PillButton>} />
    <PeriodPicker date={month + "-01"} onChange={(date) => {
      const next = date.slice(0, 7);
      setMonth(next);
      setSelected(next === pocket.today.slice(0, 7) ? pocket.today : date);
    }} />
    <section aria-label={`${monthLabel} 날짜별 지출`} className="flex flex-col gap-4 rounded-xl border border-black-010 bg-black-002 p-3 sm:p-4">
      <div className="grid grid-cols-7 gap-1">{weekdays.map((day) => <span key={day} className="pb-2 text-center text-xs leading-150 text-black-030">{day.slice(0, 1)}</span>)}</div>
      {calendar.weeks.map((week) => <div key={week.number} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-1 rounded-md border border-black-010 bg-white px-3 py-2 text-xs leading-150"><span className="font-semibold">{week.number}주차 예산</span><span className="font-numbers font-semibold">{formatMoney(allocatedBudget(pocket.data, week.period))}원</span></div>
        <div className="grid grid-cols-7 gap-1">{week.days.map((day) => day.inMonth ? <PillButton key={day.date} variant="ghost" aria-label={`${day.date}, 지출 ${formatMoney(day.amount)}원, ${day.count}건${day.date === pocket.today ? ", 오늘" : ""}`} aria-pressed={selected === day.date} aria-current={day.date === pocket.today ? "date" : undefined} onClick={() => setSelected(day.date)} className={cn("aspect-square min-w-0 flex-col justify-start gap-1 rounded-lg border px-0 py-2", selected === day.date ? "border-black-100 bg-black-100 text-white hover:bg-black-030 hover:text-white" : day.date === pocket.today ? "border-black-100 bg-white text-black-100" : day.count ? "border-black-010 bg-white text-black-100 hover:bg-black-005" : "border-transparent bg-transparent text-black-030 hover:border-black-010 hover:bg-white")}>
          <span className={cn("font-numbers text-sm leading-150", day.date === pocket.today && selected !== day.date && "font-semibold underline underline-offset-4")}>{Number(day.date.slice(8, 10))}</span>
          {day.count > 0 && <span className={cn("font-numbers w-full whitespace-nowrap px-0 text-calendar leading-150", selected === day.date ? "text-white" : "text-black-030")}>{day.amount >= 10000 ? compactMoney.format(day.amount) : formatMoney(day.amount)}</span>}
          {financeOf(pocket.data).plans.some((plan)=>plan.date===day.date) && <span className="text-calendar leading-150">예정</span>}
          {day.count > 0 && <span aria-hidden="true" className={cn("size-1 rounded-full", selected === day.date ? "bg-white" : "bg-black-100")} />}
        </PillButton> : <span key={day.date} aria-hidden="true" />)}</div>
      </div>)}
      <p className="text-xs leading-160 text-black-030">날짜를 누르면 내역을 볼 수 있습니다. 각 주의 예산은 해당 월 예산에서 배분하고 이전 초과 지출을 차감합니다.</p>
    </section>
    <section className="flex flex-col gap-3" aria-label="선택한 날짜의 지출">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base leading-150">{shortDate(selected)} 지출</h2><PillButton variant="outline" size="sm" disabled={selected > pocket.today} onClick={() => pocket.openEditor(undefined, selected)}><IconContainer size="sm"><Plus /></IconContainer>이 날짜에 추가</PillButton></div>
      <p className="font-numbers text-lg leading-150">{formatMoney(sumExpenses(selectedExpenses))}원 <span className="text-xs text-black-030">· {selectedExpenses.length}건</span></p>
      <div className="flex flex-col gap-2 rounded-lg border border-black-010 p-3"><div className="flex items-center justify-between gap-2"><h3 className="text-sm">이 날짜 약속 예정</h3><Link href="/finance" className="rounded-lg border border-black-020 px-3 py-2 text-xs">등록·관리</Link></div>{financeOf(pocket.data).plans.filter((plan)=>plan.date===selected).map((plan)=><p key={plan.id} className="text-sm">{plan.memo || "약속"} · {formatMoney(plan.amount)}원</p>)}</div>
      <ExpenseList expenses={selectedExpenses} />
    </section>
  </div>;
}

export function CalendarPage() {
  const pocket = usePocket();
  return pocket.ready ? <CalendarView /> : <PageSkeleton />;
}
