"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale/ko";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IconContainer } from "@/components/ui/icon-container";
import { isDateKey, todayInSeoul } from "@/lib/pocket";
import { cn } from "@/lib/utils";

import "@daypicker/react/style.css";

type DateFieldProps = {
  mode?: "day" | "month";
  id?: string;
  name?: string;
  value: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  triggerLabel?: ReactNode;
  onValueChange: (value: string) => void;
};

function localDate(value: string | undefined) {
  return isDateKey(value) ? new Date(value + "T12:00:00") : undefined;
}

export function DateField({
  mode = "day", id, name, value: date, min, max, disabled, required,
  className, "aria-label": label, triggerLabel, onValueChange,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const monthly = mode === "month";
  const selected = localDate(date);
  const first = localDate(min);
  const last = localDate(max);
  const today = localDate(todayInSeoul());
  const unavailable = [...(first ? [{ before: first }] : []), ...(last ? [{ after: last }] : [])];

  const display = monthly && date ? `${Number(date.slice(0, 4))}년 ${Number(date.slice(5, 7))}월` : date;
  const title = label ?? (monthly ? "월 선택" : "날짜 선택");

  function choose(value: string) {
    onValueChange(value);
    setOpen(false);
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    {name && <input type="hidden" name={name} value={date} disabled={disabled} />}
    <DialogTrigger asChild>
      <Button id={id} type="button" variant="outline" disabled={disabled} aria-label={label ? `${label}: ${display || "선택 안 함"}` : undefined}
        className={cn("w-full min-w-0 justify-center bg-white px-3 text-center text-base shadow-none", className)}>
        <span>{triggerLabel ?? (display || title)}</span>
      </Button>
    </DialogTrigger>
    <DialogContent aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{title}{required && <span className="ml-2 text-xs text-red-2">필수</span>}</DialogTitle></DialogHeader>
      <div className="min-h-0 overflow-y-auto">
        {monthly ? <MonthOptions value={date} min={min} max={max} onSelect={choose} /> : <DayPicker
          className="pocket-date-picker"
          locale={ko}
          mode="single"
          required
          autoFocus
          today={today}
          defaultMonth={selected ?? today}
          selected={selected}
          startMonth={first}
          endMonth={last}
          disabled={unavailable}
          onSelect={(next) => {
            const key = [next.getFullYear(), String(next.getMonth() + 1).padStart(2, "0"), String(next.getDate()).padStart(2, "0")].join("-");
            choose(key);
          }}
        />}
        {monthly && !required && date && <Button type="button" variant="ghost" className="mt-2" onClick={() => choose("")}>선택 해제</Button>}
      </div>
    </DialogContent>
  </Dialog>;
}

function MonthOptions({ value, min, max, onSelect }: {
  value: string;
  min?: string;
  max?: string;
  onSelect: (value: string) => void;
}) {
  const [year, setYear] = useState(() => Number((value || todayInSeoul()).slice(0, 4)));
  const minYear = min ? Number(min.slice(0, 4)) : 1;
  const maxYear = max ? Number(max.slice(0, 4)) : 9999;
  return <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="icon" aria-label="이전 해" disabled={year <= minYear} onClick={() => setYear(year - 1)}>
        <IconContainer size="sm"><ChevronLeft /></IconContainer>
      </Button>
      <p aria-live="polite" className="font-semibold">{year}년</p>
      <Button variant="ghost" size="icon" aria-label="다음 해" disabled={year >= maxYear} onClick={() => setYear(year + 1)}>
        <IconContainer size="sm"><ChevronRight /></IconContainer>
      </Button>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const key = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
        return <Button key={key} variant={value === key ? "default" : "outline"} size="sm" aria-pressed={value === key}
          disabled={Boolean((min && key < min) || (max && key > max))} onClick={() => onSelect(key)}>
          {month}월
        </Button>;
      })}
    </div>
  </div>;
}
