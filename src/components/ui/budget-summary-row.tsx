"use client";

import type { ReactNode } from "react";
import { InfoPopover } from "@/components/ui/info-popover";
import { formatMoney } from "@/lib/pocket";

export function BudgetSummaryRow({ title, amount, action, children }: {
  title: string; amount: number | null; action?: ReactNode; children?: ReactNode;
}) {
  return <section aria-label={title} className="flex min-w-0 flex-col">
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex min-w-0 items-center">
        <h2 className="text-sm leading-150 text-black-030">{title}</h2>
        {children && <InfoPopover label={`${title} 상세`}>{children}</InfoPopover>}
      </div>
      <p className="font-numbers ml-auto min-w-0 break-all text-base font-semibold leading-150">{amount === null ? "??" : formatMoney(amount)}<span className="text-xs font-medium">원</span></p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </section>;
}
