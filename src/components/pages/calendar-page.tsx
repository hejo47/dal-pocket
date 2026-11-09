"use client";

import { RecordAddMenu } from "@/components/ui/record-add-menu";
import { PlanRecord } from "@/components/pages/plan-record";
import { PlanEditor } from "@/components/pages/plan-editor";
import { RecordRemoveButton } from "@/components/ui/record-remove-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { PeriodPicker } from "@/components/ui/period-picker";

import { useState } from "react";
import { BadgeCheck, Plus } from "lucide-react";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { formatMoney, getCalendarMonth, shortDate, sumExpenses, WEEKDAYS } from "@/lib/pocket";
import { allocatedBudget, financeOf, financeSummary, planSummary } from "@/lib/finance";
import { cn } from "@/lib/utils";

const compactMoney = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });

function CalendarView() {
  const pocket = usePocket();
  const [month, setMonth] = useState(pocket.today.slice(0, 7));
  const [selected, setSelected] = useState(pocket.today);
  const [dayOpen, setDayOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const calendar = getCalendarMonth(month, pocket.data.weekStartsOn, pocket.data.expenses);
  const selectedExpenses = pocket.data.expenses.filter((expense) => expense.date === selected);
  const finance = financeOf(pocket.data);
  const stamps = new Set(finance.noSpendDates ?? []);
  const stamped = stamps.has(selected);
  const canStamp = selected <= pocket.today && selectedExpenses.length === 0;
  function toggleStamp() {
    if (!stamped && (!canStamp || stamps.size >= 10000)) return;
    const next = stamped ? [...stamps].filter((date) => date !== selected) : [...stamps, selected];
    pocket.saveFinance({ ...finance, noSpendDates: next.sort() });
  }
  const weekdays = Array.from({ length: 7 }, (_, index) => WEEKDAYS[(pocket.data.weekStartsOn + index) % 7]);
  const monthLabel = `${Number(month.slice(0, 4))}년 ${Number(month.slice(5, 7))}월`;
  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title="소비 달력" />
    <PeriodPicker date={month + "-01"} onChange={(date) => {
      const next = date.slice(0, 7);
      setMonth(next);
      setSelected(next === pocket.today.slice(0, 7) ? pocket.today : date);
    }} />
    <p className="text-xs leading-160 text-black-030">날짜를 선택해 지출과 약속을 확인하세요.</p>
    <section aria-label={`${monthLabel} 날짜별 지출`} className="flex flex-col gap-4">
      <div className="grid grid-cols-7 gap-1">{weekdays.map((day) => <span key={day} className="pb-2 text-center text-xs leading-150 text-black-030">{day.slice(0, 1)}</span>)}</div>
      {calendar.weeks.map((week) => <div key={week.number} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-1 border-t border-black-010 pt-3 text-xs leading-150 text-black-030"><span className="font-semibold">{week.number}주차 예산</span><span className="font-numbers">{formatMoney(week.period.start <= pocket.today ? financeSummary(pocket.data, week.period).budget : allocatedBudget(pocket.data, week.period))}원</span></div>
        <div className="grid grid-cols-7 gap-1">{week.days.map((day) => day.inMonth ? <PillButton key={day.date} variant="ghost" aria-label={`${day.date}, 지출 ${formatMoney(day.amount)}원, ${day.count}건${day.date === pocket.today ? ", 오늘" : ""}${day.count === 0 && stamps.has(day.date) ? ", 무지출 스탬프" : ""}`} aria-pressed={selected === day.date} aria-current={day.date === pocket.today ? "date" : undefined} onClick={() => { setSelected(day.date); setDayOpen(true); }} className={cn("min-h-16 min-w-0 flex-col justify-start gap-1 rounded-lg border px-0 py-2", selected === day.date ? "border-transparent bg-black-100 text-white hover:bg-black-030 hover:text-white" : day.date === pocket.today ? "border-black-010 bg-white text-black-100" : day.count ? "border-transparent bg-black-002 text-black-100 hover:bg-black-005" : "border-transparent bg-transparent text-black-030 hover:border-black-010 hover:bg-white")}>
          <span className={cn("font-numbers text-sm leading-150", day.date === pocket.today && selected !== day.date && "font-semibold underline underline-offset-4")}>{Number(day.date.slice(8, 10))}</span>
          {day.count > 0 && <span className={cn("font-numbers w-full whitespace-nowrap px-0 text-calendar leading-150", selected === day.date ? "text-white" : "text-black-030")}>{day.amount >= 10000 ? compactMoney.format(day.amount) : formatMoney(day.amount)}</span>}
          {day.count === 0 && stamps.has(day.date)
            ? <IconContainer size="default"><BadgeCheck /></IconContainer>
            : finance.plans.some((plan) => plan.date === day.date) && <span className="text-calendar leading-150">약속</span>}
          {day.count > 0 && <span aria-hidden="true" className={cn("size-1 rounded-full", selected === day.date ? "bg-white" : "bg-black-100")} />}
        </PillButton> : <span key={day.date} aria-hidden="true" />)}</div>
      </div>)}
    </section>
    <Dialog open={dayOpen} onOpenChange={setDayOpen}>
      <DialogContent placement="bottom" className="max-h-[75dvh]" aria-describedby="calendar-day-summary">
        <DialogHeader>
          <DialogTitle>{shortDate(selected)}</DialogTitle>
          <DialogDescription id="calendar-day-summary">지출 {formatMoney(sumExpenses(selectedExpenses))}원 · {selectedExpenses.length}건</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PillButton type="button" variant="ghost" size="sm" aria-pressed={stamped} disabled={!stamped && (!canStamp || stamps.size >= 10000)} onClick={toggleStamp}>
            <IconContainer size="default"><BadgeCheck /></IconContainer>{stamped ? "무지출 완료" : "무지출 체크"}
          </PillButton>
          <RecordAddMenu expenseDisabled={selected > pocket.today}
            onExpense={() => { setDayOpen(false); pocket.openEditor(undefined, selected); }}
            onPlan={() => { setDayOpen(false); setPlanOpen(true); }}
            trigger={<PillButton variant="outline" size="sm"><IconContainer size="default"><Plus /></IconContainer>이 날짜에 추가</PillButton>} />
        </div>
        <div className="pocket-dialog-scroll flex flex-col gap-4">
          {finance.plans.some((plan) => plan.date === selected) && <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">약속</h3>
            {finance.plans.filter((plan) => plan.date === selected).sort((a, b) => Number(planSummary(pocket.data, a).completed) - Number(planSummary(pocket.data, b).completed)).map((plan) => <PlanRecord key={plan.id} plan={plan}
              onExpenseSelect={(expense) => { setDayOpen(false); pocket.openEditor(expense); }}
              action={<RecordRemoveButton planned label={`${plan.memo || "약속"} 예정 해제`} onClick={() => pocket.saveFinance({ ...finance, plans: finance.plans.filter((entry) => entry.id !== plan.id) })} />} />)}
          </section>}
          <ExpenseList expenses={selectedExpenses} onSelect={(expense) => { setDayOpen(false); pocket.openEditor(expense); }} />
        </div>
      </DialogContent>
    </Dialog>
    {planOpen && <PlanEditor key={selected} date={selected} open={planOpen} onOpenChange={setPlanOpen} />}

  </div>;
}

export function CalendarPage() {
  const pocket = usePocket();
  return pocket.ready ? <CalendarView /> : <PageSkeleton />;
}
