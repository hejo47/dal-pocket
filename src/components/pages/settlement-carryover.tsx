"use client";

import { usePocket } from "@/components/providers/pocket-provider";
import { SectionCard } from "@/components/ui/section-card";
import { MoneyRow } from "@/components/ui/money-row";
import { PillButton } from "@/components/ui/pill-button";
import { FieldHint } from "@/components/ui/form-field";
import { settlementCarryover } from "@/lib/finance";
import { formatMoney, shortDate } from "@/lib/pocket";

export function SettlementCarryover({ month }: { month: string }) {
  const pocket = usePocket();
  const pending = settlementCarryover(pocket.data, month);
  return <SectionCard title="이월된 정산">
    <FieldHint>지난달까지 발생한 미정산 내역이에요. 발생한 다음 달부터 표시하고, 정산한 날짜에만 현금에 반영합니다. 선택한 달 말일 기준입니다.</FieldHint>
    <dl><MoneyRow label="받을 정산" amount={pending.receivable} /><MoneyRow label="보낼 정산" amount={pending.payable} /></dl>
    {pending.entries.length > 0 ? <details><summary className="cursor-pointer py-2 text-xs">미정산 내역 보기 · {pending.entries.length}건</summary><div className="flex flex-col gap-2 pt-2">{pending.entries.map(({ expense, direction, amount }) =>
      <PillButton key={expense.id} variant="ghost" className="w-full min-w-0 justify-between gap-3 bg-black-002 px-3 text-left font-normal" onClick={() => pocket.openEditor(expense)}>
        <span className="flex min-w-0 flex-col gap-1"><span className="break-words text-sm font-semibold">{expense.memo || expense.category}</span><span className="text-xs text-black-030">{shortDate(expense.date)} 지출 · {direction === "receivable" ? "받을 정산" : "보낼 정산"}</span></span><span className="font-numbers shrink-0 text-sm font-semibold">{formatMoney(amount)}원</span>
      </PillButton>)}</div></details> : <FieldHint>이월된 미정산 내역이 없습니다.</FieldHint>}
  </SectionCard>;
}
