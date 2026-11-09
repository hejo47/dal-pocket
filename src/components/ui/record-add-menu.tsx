"use client";

import { useRef } from "react";
import type { ReactElement } from "react";
import { DropdownMenu } from "radix-ui";
import { CalendarPlus, ReceiptText } from "lucide-react";
import { IconContainer } from "@/components/ui/icon-container";

export function RecordAddMenu({ trigger, onExpense, onPlan, expenseDisabled = false, side = "bottom" }: {
  trigger: ReactElement; onExpense: () => void; onPlan: () => void; expenseDisabled?: boolean; side?: "top" | "bottom";
}) {
  const openingEditor = useRef(false);
  const itemClass = "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-3 text-sm outline-none data-[highlighted]:bg-black-005 data-[disabled]:opacity-40";
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content side={side} sideOffset={8} align="end" collisionPadding={15} aria-label="등록 종류" className="z-50 flex min-w-40 flex-col gap-1 rounded-xl border border-black-010 bg-white p-1 shadow-md"
        onCloseAutoFocus={(event) => { if (openingEditor.current) { event.preventDefault(); openingEditor.current = false; } }}>
        <DropdownMenu.Item disabled={expenseDisabled} className={itemClass} onSelect={() => { openingEditor.current = true; onExpense(); }}><IconContainer><ReceiptText /></IconContainer>지출 등록</DropdownMenu.Item>
        <DropdownMenu.Item className={itemClass} onSelect={() => { openingEditor.current = true; onPlan(); }}><IconContainer><CalendarPlus /></IconContainer>약속 등록</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
