"use client";

import type { ReactNode } from "react";
import { Popover } from "radix-ui";
import { InfoButton } from "@/components/ui/info-button";

export function InfoPopover({ label, children }: { label: string; children: ReactNode }) {
  return <Popover.Root>
    <Popover.Trigger asChild><InfoButton label={label} /></Popover.Trigger>
    <Popover.Portal>
      <Popover.Content side="bottom" align="start" sideOffset={6} collisionPadding={15} aria-label={label}
        className="z-50 flex w-72 max-w-[calc(100vw-30px)] flex-col gap-3 overflow-y-auto rounded-xl border border-black-010 bg-white p-4 text-sm leading-160 text-black-030 shadow-md"
        style={{ maxHeight: "var(--radix-popover-content-available-height)" }}>
        {children}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
