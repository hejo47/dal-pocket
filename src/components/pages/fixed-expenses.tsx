"use client";

import { useState } from "react";
import { usePocket } from "@/components/providers/pocket-provider";
import { FieldLabel, FieldHint, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { financeOf, fixedDueDate } from "@/lib/finance";
import { formatMoney, parseAmount, validAmount } from "@/lib/pocket";

export function FixedExpenses({ month }: { month: string }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const items = finance.fixedExpenses ?? [];
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(pocket.today);
  const [endMonth, setEndMonth] = useState("");
  return <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-black-020 p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">고정 지출</h2><PillButton variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? "접기" : "고정 내역 추가"}</PillButton></div>
    {open && <form className="flex min-w-0 flex-col gap-3 rounded-lg bg-black-002 p-3" onSubmit={(event) => {
      event.preventDefault();
      const parsed = parseAmount(amount);
      if (!validAmount(parsed) || endMonth && endMonth < date.slice(0, 7)) return;
      pocket.saveFinance({ ...finance, fixedExpenses: [...items, { id: crypto.randomUUID(), date, amount: parsed, memo, endMonth: endMonth || undefined, includeInBudget: false }] });
      setAmount(""); setMemo(""); setOpen(false);
    }}>
      <FieldLabel htmlFor="fixed-name" required>내역 이름</FieldLabel><TextField id="fixed-name" required maxLength={80} value={memo} placeholder="월세, 통신비, 구독료 등" onChange={(event) => setMemo(event.target.value)} />
      <FieldLabel htmlFor="fixed-amount" required>매달 지출 금액</FieldLabel><TextField id="fixed-amount" required inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
      <FieldLabel htmlFor="fixed-date" required>첫 지출일 · 매달 같은 날짜에 반복</FieldLabel><TextField id="fixed-date" required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <FieldLabel htmlFor="fixed-end">마지막 적용 월 · 선택</FieldLabel><TextField id="fixed-end" type="month" min={date.slice(0, 7)} value={endMonth} onChange={(event) => setEndMonth(event.target.value)} />
      <FieldHint>합계는 일반 지출과 별도로 표시합니다. 현금 잔액에는 반영하며, 29~31일이 없는 달은 말일에 적용합니다. 같은 금액을 일반 지출에 중복 등록하지 마세요.</FieldHint><PillButton type="submit">고정 내역 저장</PillButton>
    </form>}
    {items.length ? items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-t border-black-010 py-3"><div className="flex min-w-0 flex-col gap-1"><p className="break-words text-sm">{item.memo}</p><p className="font-numbers text-sm">매월 {formatMoney(item.amount)}원</p><p className="text-xs leading-160 text-black-030">{item.date}부터 {item.endMonth ? item.endMonth + "까지" : "반복"} · {item.includeInBudget ? "생활 예산 포함" : "생활 예산 제외"}</p><p className="text-xs text-black-030">{fixedDueDate(item, month) ? month + " 적용일: " + fixedDueDate(item, month) : month + "에는 적용되지 않음"}</p></div><PillButton variant="outline" size="sm" onClick={() => pocket.saveFinance({ ...finance, fixedExpenses: items.filter((entry) => entry.id !== item.id) })}>삭제</PillButton></div>) : <FieldHint>등록된 고정 내역이 없습니다.</FieldHint>}
  </section>;
}
