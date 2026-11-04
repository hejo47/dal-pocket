import type { ReactNode } from "react";
import { formatMoney } from "@/lib/pocket";
import { ChevronDown } from "lucide-react";
import { IconContainer } from "@/components/ui/icon-container";

export function SectionCard({ title, action, summary, expanded, onToggle, children }: {
  title: string; action?: ReactNode; summary?: { label: string; amount: number }; expanded?: boolean; onToggle?: () => void; children: ReactNode;
}) {
  return <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-black-010 p-4">
    <div className="flex min-h-11 items-center justify-between gap-2">
      <h2 className="min-w-0 flex-1 text-sm font-semibold leading-150">{onToggle
        ? <button type="button" className="flex w-full cursor-pointer items-center justify-between gap-2 py-2 text-left" aria-expanded={expanded} onClick={onToggle}>{title}<IconContainer className={expanded ? "rotate-180" : undefined}><ChevronDown /></IconContainer></button>
        : title}</h2>
      {action}
    </div>
    {expanded !== false && <>
      {summary && <div className="flex flex-col gap-1">
        <p className="text-xs leading-150 text-black-030">{summary.label}</p>
        <p className="font-numbers text-2xl font-semibold leading-140">{formatMoney(summary.amount)}<span className="text-sm font-medium">원</span></p>
      </div>}
      {children}
    </>}
  </section>;
}
