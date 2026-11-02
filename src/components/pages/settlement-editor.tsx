"use client";

import { DateField, FieldHint, FieldLabel, SelectField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { resizeSettlements, settlementRecords, settlementSummary } from "@/lib/finance";
import type { Payment, Settlement } from "@/lib/finance";
import { formatMoney } from "@/lib/pocket";

export function SettlementEditor({ payment, onChange, today }: { payment: Payment; onChange: (patch: Partial<Payment>) => void; today: string }) {
  const records = settlementRecords(payment);
  const summary = settlementSummary(payment);
  function update(next: Settlement[]) {
    const received = next.reduce((sum, receipt) => sum + receipt.count, 0);
    onChange({ settlements: next, settled: received === summary.people, settledDate: next.at(-1)?.date ?? today });
  }
  return <div className="flex min-w-0 flex-col gap-3 border-t border-black-010 pt-3">
    <p className="text-sm">정산 받음 {summary.count}명 / {summary.people}명 (본인 제외)</p>
    <FieldHint>받은 금액 {formatMoney(summary.receivedAmount)}원 · 받을 금액 {formatMoney(summary.outstanding)}원</FieldHint>
    <FieldLabel htmlFor="settlement-count">지금까지 받은 인원 (본인 제외)</FieldLabel><SelectField id="settlement-count" value={summary.count} options={Array.from({ length: summary.people + 1 }, (_, index) => ({ value: String(index), label: index === 0 ? "아직 받지 않음" : index + "명분 받음" }))} onChange={(event) => update(resizeSettlements(payment, Number(event.target.value), today))} />
    {summary.count > 0 && <><FieldLabel htmlFor="settlement-date">최근 정산 받은 날짜</FieldLabel><DateField id="settlement-date" required max={today} value={records.at(-1)?.date ?? today} onChange={(event) => { update(records.map((receipt,index) => index === records.length - 1 ? { ...receipt, date: event.target.value } : receipt)); }} /></>}
    <FieldHint>인원을 선택한 뒤 아래 저장을 누르면 정산 내용도 함께 저장됩니다.</FieldHint>
    {records.map((receipt, index) => <div key={index} className="flex items-center justify-between gap-2 text-xs"><span>{receipt.date} · {receipt.count}명분 받음</span><PillButton type="button" variant="ghost" size="sm" aria-label={receipt.date + " 정산 " + receipt.count + "명분 삭제"} onClick={() => update(records.filter((_, itemIndex) => itemIndex !== index))}>삭제</PillButton></div>)}
  </div>;
}
