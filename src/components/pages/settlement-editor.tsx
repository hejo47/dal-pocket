"use client";

import { useState } from "react";
import { DateField, FieldHint, FieldLabel, SelectField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { settlementRecords, settlementSummary } from "@/lib/finance";
import type { Payment, Settlement } from "@/lib/finance";
import { formatMoney, isDateKey } from "@/lib/pocket";

export function SettlementEditor({ payment, onChange, today }: { payment: Payment; onChange: (patch: Partial<Payment>) => void; today: string }) {
  const [count, setCount] = useState("1");
  const [date, setDate] = useState(today);
  const records = settlementRecords(payment);
  const summary = settlementSummary(payment);
  const remaining = Math.max(0, summary.people - summary.count);
  function update(next: Settlement[]) {
    const received = next.reduce((sum, receipt) => sum + receipt.count, 0);
    onChange({ settlements: next, settled: received === summary.people, settledDate: next.at(-1)?.date ?? today });
  }
  return <div className="flex min-w-0 flex-col gap-3 border-t border-black-010 pt-3">
    <p className="text-sm">정산 받음 {summary.count}명 / {summary.people}명 (본인 제외)</p>
    <FieldHint>받은 금액 {formatMoney(summary.receivedAmount)}원 · 받을 금액 {formatMoney(summary.outstanding)}원</FieldHint>
    {remaining > 0 && <>
      <FieldLabel htmlFor="settlement-count">이번에 받은 인원</FieldLabel><SelectField id="settlement-count" value={Math.min(Number(count), remaining)} options={Array.from({ length: remaining }, (_, index) => ({ value: String(index + 1), label: (index + 1) + "명분 받음" }))} onChange={(event) => setCount(event.target.value)} />
      <FieldLabel htmlFor="settlement-date">받은 날짜</FieldLabel><DateField id="settlement-date" max={today} value={date} onChange={(event) => setDate(event.target.value)} />
      <PillButton type="button" variant="outline" size="sm" disabled={!isDateKey(date) || date > today} onClick={() => update([...records, { count: Math.min(Number(count), remaining), date }])}>정산 받은 내용 추가</PillButton>
      <FieldHint>추가한 정산은 아래 지출 저장을 눌렀을 때 함께 저장됩니다.</FieldHint>
    </>}
    {records.map((receipt, index) => <div key={index} className="flex items-center justify-between gap-2 text-xs"><span>{receipt.date} · {receipt.count}명분 받음</span><PillButton type="button" variant="ghost" size="sm" aria-label={receipt.date + " 정산 " + receipt.count + "명분 삭제"} onClick={() => update(records.filter((_, itemIndex) => itemIndex !== index))}>삭제</PillButton></div>)}
  </div>;
}
