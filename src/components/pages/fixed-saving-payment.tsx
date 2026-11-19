"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { usePocket } from "@/components/providers/pocket-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { PillButton } from "@/components/ui/pill-button";
import { DateField, FieldError, FieldHint, FieldLabel, SelectField, TextField } from "@/components/ui/form-field";
import { completeFixedSaving, financeOf, fixedDueDate, fixedSavingForMonth } from "@/lib/finance";
import type { FixedExpense } from "@/lib/finance";
import { formatMoney, getPeriod, parseAmount, shortDate } from "@/lib/pocket";

export function FixedSavingPayment({ item, month }: { item: FixedExpense; month: string }) {
  const pocket = usePocket(), finance = financeOf(pocket.data);
  const paid = fixedSavingForMonth(finance, item, month);
  const [open, setOpen] = useState(false), [date, setDate] = useState(""), [amount, setAmount] = useState(""), [existingId, setExistingId] = useState(""), [error, setError] = useState("");
  const end = getPeriod("monthly", 1, month + "-01").end;
  const latest = end < pocket.today ? end : pocket.today;
  const candidates = (finance.savings ?? []).filter((entry) => entry.direction === "deposit" && !entry.fixedExpenseId && entry.date.startsWith(month));
  if (!fixedDueDate(item, month)) return <FieldHint>이 달에는 납입 일정이 없습니다.</FieldHint>;
  function openForm() {
    setDate(paid?.date ?? (pocket.today.startsWith(month) ? pocket.today : latest));
    setAmount(String(paid?.amount ?? item.amount)); setExistingId(""); setError(""); setOpen(true);
  }
  return <div className="flex flex-col gap-2 rounded-lg bg-black-002 p-3">
    {paid ? <div className="flex items-center justify-between gap-2"><div><p className="flex items-center gap-1 text-sm font-semibold"><Check size={16} />{Number(month.slice(5))}월 납입 완료</p><p className="mt-1 text-xs text-black-030">{shortDate(paid.date)} · {formatMoney(paid.amount)}원</p></div><IconButton label={`${item.memo} 납입 기록 수정`} onClick={openForm}><Pencil /></IconButton></div> : <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-black-030">{Number(month.slice(5))}월 납입 예정</p><PillButton size="sm" disabled={month + "-01" > pocket.today} onClick={openForm}>납입 완료</PillButton></div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{paid ? "납입 기록 수정" : "저축 납입 완료"}</DialogTitle><DialogDescription>{item.memo} · {Number(month.slice(5))}월</DialogDescription></DialogHeader>
      <form className="pocket-dialog-scroll flex flex-col gap-3" onSubmit={(event) => {
        event.preventDefault();
        const existing = candidates.find((entry) => entry.id === existingId);
        const actualDate = existing?.date ?? date;
        if (actualDate > pocket.today) { setError("실제 납입일은 오늘 또는 이전 날짜를 선택해주세요."); return; }
        try { pocket.saveFinance(completeFixedSaving(finance, item.id, month, { date: actualDate, amount: existing?.amount ?? parseAmount(amount), savingsId: existingId || undefined })); setOpen(false); }
        catch { setError("날짜·금액을 확인해주세요. 이미 다른 납입에 사용한 저축 기록은 선택할 수 없습니다."); }
      }}>
        {!paid && candidates.length > 0 && <><FieldLabel htmlFor={`saving-record-${item.id}`}>이미 저축 기록을 남겼나요?</FieldLabel><SelectField id={`saving-record-${item.id}`} value={existingId} options={[{ value: "", label: "아니요 · 새 납입 기록" }, ...candidates.map((entry) => ({ value: entry.id, label: `${shortDate(entry.date)} · ${entry.memo || "저축"} · ${formatMoney(entry.amount)}원` }))]} onChange={(event) => setExistingId(event.target.value)} /></>}
        {!existingId && <><FieldLabel htmlFor={`saving-paid-date-${item.id}`} required>실제 납입일</FieldLabel><DateField id={`saving-paid-date-${item.id}`} required min={month + "-01"} max={latest} value={date} onValueChange={setDate} /><FieldLabel htmlFor={`saving-paid-amount-${item.id}`} required>납입 금액</FieldLabel><TextField id={`saving-paid-amount-${item.id}`} required inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 9))} /></>}
        <FieldHint>완료하면 저축 내역에 자동 반영됩니다. 이 달의 예정 저축 대신 실제 납입 금액을 한 번만 차감합니다.</FieldHint><FieldError>{error}</FieldError><PillButton type="submit">{paid ? "수정 저장" : "납입 완료 저장"}</PillButton>
      </form>
    </DialogContent></Dialog>
  </div>;
}
