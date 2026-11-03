"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";
import { TextField } from "@/components/ui/form-field";
import { getPeriod, isDateKey, offsetDate } from "@/lib/pocket";

export function PeriodPicker({ mode = "monthly", date, maxDate, weekStartsOn = 1, onChange }: {
  mode?: "weekly" | "monthly";
  date: string;
  maxDate?: string;
  weekStartsOn?: number;
  onChange: (date: string) => void;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const monthly = mode === "monthly";
  const unit = monthly ? "달" : "주";
  const period = getPeriod(mode, weekStartsOn, date);
  function select(value: string) {
    const next = monthly ? value.slice(0, 7) + "-01" : value;
    if (isDateKey(next) && (!maxDate || next <= maxDate)) onChange(next);
  }

  return <div className="flex min-w-0 flex-col gap-2">
    <div className="flex min-w-0 items-center gap-2">
      <PillButton type="button" variant="outline" size="icon" className="shrink-0" aria-label={`이전 ${unit}`} onClick={() => select(offsetDate(period.start, -1))}>
        <IconContainer size="slg"><ChevronLeft /></IconContainer>
      </PillButton>
      {monthly ? <div className="min-w-0 flex-1">
        <TextField aria-label={monthly ? "조회할 달" : "조회할 날짜"} type={monthly ? "month" : "date"} value={monthly ? date.slice(0, 7) : date} max={monthly ? maxDate?.slice(0, 7) : maxDate} onChange={(event) => select(event.target.value)} />
      </div> : <PillButton type="button" variant="outline" className="min-w-0 flex-1" aria-expanded={dateOpen} onClick={() => setDateOpen((open) => !open)}>
        <span>{Number(period.start.slice(5, 7))}월 {period.weekNumber}주차 · {period.label}</span>
        <IconContainer size="sm"><ChevronDown /></IconContainer>
      </PillButton>}
      <PillButton type="button" variant="outline" size="icon" className="shrink-0" aria-label={`다음 ${unit}`} disabled={Boolean(maxDate && period.end >= maxDate)} onClick={() => select(offsetDate(period.end, 1))}>
        <IconContainer size="slg"><ChevronRight /></IconContainer>
      </PillButton>
    </div>
    {!monthly && dateOpen && <TextField aria-label="조회할 주의 날짜" type="date" value={date} max={maxDate} onChange={(event) => {
      if (!isDateKey(event.target.value) || (maxDate && event.target.value > maxDate)) return;
      select(event.target.value);
      setDateOpen(false);
    }} />}
  </div>;
}
