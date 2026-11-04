"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";
import { DateField } from "@/components/ui/form-field";
import { getPeriod, isDateKey, offsetDate } from "@/lib/pocket";

export function PeriodPicker({ mode = "monthly", date, maxDate, weekStartsOn = 1, onChange }: {
  mode?: "daily" | "weekly" | "monthly";
  date: string;
  maxDate?: string;
  weekStartsOn?: number;
  onChange: (date: string) => void;
}) {
  const monthly = mode === "monthly";
  const daily = mode === "daily";
  const unit = monthly ? "달" : daily ? "날" : "주";
  const period = getPeriod(daily ? "weekly" : mode, weekStartsOn, date);
  const start = daily ? date : period.start;
  const end = daily ? date : period.end;
  function select(value: string) {
    const next = monthly ? value.slice(0, 7) + "-01" : value;
    if (isDateKey(next) && (!maxDate || next <= maxDate)) onChange(next);
  }

  return <div className="flex min-w-0 flex-col gap-2">
    <div className="flex min-w-0 items-center gap-2">
      <PillButton type="button" variant="outline" size="icon" className="shrink-0" aria-label={`이전 ${unit}`} onClick={() => select(offsetDate(start, -1))}>
        <IconContainer size="slg"><ChevronLeft /></IconContainer>
      </PillButton>
      <div className="min-w-0 flex-1">
        <DateField mode={monthly ? "month" : "day"} aria-label={monthly ? "조회할 달" : daily ? "조회할 날짜" : "조회할 주"}
          value={monthly ? date.slice(0, 7) : date} max={monthly ? maxDate?.slice(0, 7) : maxDate} onValueChange={select} required
          triggerLabel={monthly || daily ? undefined : `${Number(period.start.slice(5, 7))}월 ${period.weekNumber}주차 (${period.label})`} />
      </div>
      <PillButton type="button" variant="outline" size="icon" className="shrink-0" aria-label={`다음 ${unit}`} disabled={Boolean(maxDate && end >= maxDate)} onClick={() => select(offsetDate(end, 1))}>
        <IconContainer size="slg"><ChevronRight /></IconContainer>
      </PillButton>
    </div>

  </div>;
}
