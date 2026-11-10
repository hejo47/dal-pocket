"use client";

import { FieldHint, FieldLabel, SelectField } from "@/components/ui/form-field";
import { resizeSettlements, settlementSummary, payableSummary, resizeRepayments } from "@/lib/finance";
import type { Payment, Settlement } from "@/lib/finance";
import { formatMoney } from "@/lib/pocket";

export function SettlementEditor({ payment, onChange, today }: { payment: Payment; onChange: (patch: Partial<Payment>) => void; today: string }) {
  const summary = settlementSummary(payment);
  const payable = payableSummary(payment);
  if (payment.paidBy === "other") return <div className="flex min-w-0 flex-col gap-3 border-t border-black-010 pt-3">
    <p className="text-sm font-semibold">보낼 정산</p>
    <FieldHint>내 부담 {formatMoney(payable.total)}원 · 보낸 금액 {formatMoney(payable.sentAmount)}원 · 아직 보낼 금액 {formatMoney(payable.outstanding)}원</FieldHint>
    <FieldLabel htmlFor="repayment-status">송금 상태</FieldLabel>
    <SelectField id="repayment-status" value={payable.sentAmount} options={[
      { value: "0", label: "아직 보내지 않음" },
      ...(payable.sentAmount > 0 && payable.sentAmount < payable.total ? [{ value: String(payable.sentAmount), label: `일부 송금 · ${formatMoney(payable.sentAmount)}원` }] : []),
      ...(payable.total > 0 ? [{ value: String(payable.total), label: "전액 송금 완료" }] : []),
    ]} onChange={(event) => onChange({ repayments: resizeRepayments(payment, Number(event.target.value), today) })} />
    <FieldHint>아래 저장을 누르면 반영됩니다. 생활 예산에는 소비한 날의 내 부담액을, 현금 잔액에는 실제 송금한 날의 금액을 반영해요.</FieldHint>
  </div>;
  function update(next: Settlement[]) {
    const received = next.reduce((sum, receipt) => sum + receipt.count, 0);
    onChange({ settlements: next, settled: received === summary.people, settledDate: next.at(-1)?.date ?? today });
  }
  return <div className="flex min-w-0 flex-col gap-3 border-t border-black-010 pt-3">
    <p className="text-sm">정산 받음 {summary.count}명 / {summary.people}명 (본인 제외)</p>
    <FieldHint>받은 금액 {formatMoney(summary.receivedAmount)}원 · 받을 금액 {formatMoney(summary.outstanding)}원</FieldHint>
    <FieldLabel htmlFor="settlement-count">지금까지 받은 인원 (본인 제외)</FieldLabel><SelectField id="settlement-count" value={summary.count} options={Array.from({ length: summary.people + 1 }, (_, index) => ({ value: String(index), label: index === 0 ? "아직 받지 않음" : index + "명분 받음" }))} onChange={(event) => update(resizeSettlements(payment, Number(event.target.value), today))} />
    <FieldHint>인원을 선택한 뒤 아래 저장을 누르면 정산 내용도 함께 저장됩니다.</FieldHint>
  </div>;
}
