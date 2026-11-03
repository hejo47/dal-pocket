"use client";

import { useState } from "react";
import { usePocket } from "@/components/providers/pocket-provider";
import { FieldHint, FieldLabel, SelectField, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { cashFlow, financeOf } from "@/lib/finance";
import { formatMoney, parseAmount, validAmount } from "@/lib/pocket";

export function SavingsSection({ month }: { month: string }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const flow = cashFlow(pocket.data, month);
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"deposit" | "withdraw">("deposit");
  const [date, setDate] = useState(pocket.today);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  return <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-black-020 p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">저축</h2><PillButton variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? "접기" : "저축 기록 추가"}</PillButton></div>
    {pocket.data.mode === "monthly" && <><p className="text-xs text-black-030">등록 기준 누적 저축 잔액 · 선택한 달 말일 기준</p><p className="font-numbers text-2xl">{formatMoney(flow.savingsBalance)}원</p></>}
    <div className="flex flex-col gap-1 text-sm"><p>이달 저축 {formatMoney(flow.savedMonth)}원</p><p>이달 인출 {formatMoney(flow.withdrawnMonth)}원</p></div>
    {open && <form className="flex min-w-0 flex-col gap-3 rounded-lg bg-black-002 p-3" onSubmit={(event) => {
      event.preventDefault(); const parsed = parseAmount(amount); if (!validAmount(parsed)) return;
      pocket.saveFinance({ ...finance, savings: [...(finance.savings ?? []), { id: crypto.randomUUID(), date, amount: parsed, memo, direction }] });
      setAmount(""); setMemo(""); setOpen(false);
    }}>
      <FieldLabel htmlFor="savings-direction">기록 종류</FieldLabel><SelectField id="savings-direction" value={direction} options={[{ value: "deposit", label: "저축 계좌로 넣음" }, { value: "withdraw", label: "저축 계좌에서 꺼냄" }]} onChange={(event) => setDirection(event.target.value as typeof direction)} />
      <FieldLabel htmlFor="savings-date" required>날짜</FieldLabel><TextField id="savings-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
      <FieldLabel htmlFor="savings-amount" required>금액</FieldLabel><TextField id="savings-amount" inputMode="numeric" required value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
      <FieldLabel htmlFor="savings-memo">계좌·내용 메모</FieldLabel><TextField id="savings-memo" maxLength={80} placeholder="적금, 비상금 등" value={memo} onChange={(event) => setMemo(event.target.value)} />
      <FieldHint>저축은 소비·생활 예산 합계에 넣지 않습니다. 저축하면 사용 가능한 현금이 줄고, 인출하면 늘어납니다. 시작 현금 잔액에 이미 반영된 이전 저축은 현금 계산 시작일 이전 날짜로 기록하세요.</FieldHint><PillButton type="submit">저축 기록 저장</PillButton>
    </form>}
    {(finance.savings ?? []).filter((item) => item.date.slice(0,7) === month).sort((a,b) => b.date.localeCompare(a.date)).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-t border-black-010 py-3"><div className="flex min-w-0 flex-col gap-1"><p className="break-words text-sm">{item.memo || "저축"}</p><p className="font-numbers text-sm">{item.direction === "deposit" ? "저축" : "인출"} {formatMoney(item.amount)}원</p><p className="text-xs text-black-030">{item.date}</p></div><PillButton variant="outline" size="sm" onClick={() => pocket.saveFinance({ ...finance, savings: (finance.savings ?? []).filter((entry) => entry.id !== item.id) })}>삭제</PillButton></div>)}
  </section>;
}
