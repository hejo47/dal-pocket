import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { IconContainer } from "@/components/ui/icon-container";

export function SectionCard({ title, action, expanded, onToggle, children }: {
  title: string; action?: ReactNode; expanded?: boolean; onToggle?: () => void; children: ReactNode;
}) {
  return <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-black-010 p-4">
    <div className="flex min-h-11 items-center justify-between gap-2">
      <h2 className="min-w-0 flex-1 text-sm font-semibold leading-150">{onToggle
        ? <button type="button" className="flex w-full cursor-pointer items-center justify-between gap-2 py-2 text-left" aria-expanded={expanded} onClick={onToggle}>{title}<IconContainer className={expanded ? "rotate-180" : undefined}><ChevronDown /></IconContainer></button>
        : title}</h2>
      {action}
    </div>
    {expanded !== false && children}
  </section>;
}
