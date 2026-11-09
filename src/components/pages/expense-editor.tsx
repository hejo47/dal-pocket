"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Switch } from "@/components/ui/switch";
import { SettlementEditor } from "@/components/pages/settlement-editor";
import { settlementRecords } from "@/lib/finance";
import { usePocket } from "@/components/providers/pocket-provider";
import { ActionButtonRow } from "@/components/ui/action-button-row";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateField, FieldError, FieldHint, FieldLabel, SelectField, TextField } from "@/components/ui/form-field";

import { formatMoney, isDateKey, parseAmount, validAmount } from "@/lib/pocket";

export function ExpenseEditor() {
  const pocket = usePocket();
  const { editor, updateDraft } = pocket;
  const [error, setError] = useState("");
  const payment = { gross: parseAmount(editor.draft.amount), split: 1, method: "card" as "cash" | "card", settled: false, settledDate: pocket.today, note: "", groceries: false, ...editor.draft.payment };
  const updatePayment = (patch: Partial<typeof payment>) => updateDraft({ payment: { ...payment, ...patch } });
  const splitInput = editor.draft.splitInput ?? String(payment.split);
  const splitValid = Number.isInteger(Number(splitInput)) && Number(splitInput) >= 1 && Number(splitInput) <= 100 && splitInput.trim() !== "";
  const editing = editor.expenseId !== null;
  function submit(event: FormEvent) {
    event.preventDefault();
    const amount = parseAmount(editor.draft.amount);
    if (!validAmount(amount)) { setError("지출 금액을 1원부터 1억 원까지 입력해주세요."); return; }
    if (!isDateKey(editor.draft.date) || editor.draft.date > pocket.today) { setError("오늘 또는 이전 날짜를 선택해주세요."); return; }
    if (!splitValid) { setError("나눌 인원을 1명부터 100명까지 입력해주세요."); return; }
    if (settlementRecords(payment).reduce((sum,receipt)=>sum+receipt.count,0) > payment.split - 1) { setError("이미 정산받은 인원보다 나눌 인원이 작습니다. 정산 기록을 먼저 수정해주세요."); return; }
    setError("");
    pocket.saveExpense(amount);
  }
  return <Dialog open={editor.open} onOpenChange={(open) => { if (!open) pocket.closeEditor(); }}>
    <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); pocket.restoreEditorFocus(); }} onOpenAutoFocus={(event) => {
      event.preventDefault();
      document.querySelector<HTMLButtonElement>("[data-dialog-close]")?.focus({ preventScroll: true });
    }}>
      <DialogHeader><DialogTitle>{editing ? "지출 수정" : "지출 추가"}</DialogTitle><DialogDescription>금액과 카테고리를 입력해주세요.</DialogDescription></DialogHeader>
      <form id="expense-form" onSubmit={submit} className="flex min-h-0 flex-col gap-5">
        <div className="pocket-dialog-scroll flex flex-col gap-5">
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="expense-amount" required>결제한 원래 금액</FieldLabel><div className="flex items-center gap-2 rounded-lg border border-black-010 px-3 py-3"><TextField id="expense-amount" required inputMode="numeric" autoComplete="off" placeholder="0" className="font-numbers border-0 px-0 py-0 text-3xl" value={editor.draft.amount ? formatMoney(parseAmount(editor.draft.amount)) : ""} onChange={(event) => { updateDraft({ amount: event.target.value.replace(/\D/g, "").slice(0, 9) }); setError(""); }} /><span className="text-sm text-black-030">원</span></div></div>
          <div className="flex flex-col gap-2 rounded-lg bg-black-002 p-3"><FieldLabel htmlFor="expense-split">나눌 인원 (본인 포함)</FieldLabel><TextField id="expense-split" type="text" inputMode="numeric" required maxLength={3} value={splitInput} onChange={(event) => { const value=event.target.value.replace(/\D/g, ""); const count=Number(value); updateDraft({ splitInput:value, payment:{...payment, settlements:settlementRecords(payment), split:count >= 1 && count <= 100 ? count : payment.split} }); setError(""); }} /><FieldHint>총 {formatMoney(parseAmount(editor.draft.amount))}원 ÷ {payment.split}명 = 내 부담 {formatMoney(Math.ceil(parseAmount(editor.draft.amount) / payment.split))}원. 생활 예산에는 내 부담액만 반영합니다.</FieldHint><FieldLabel htmlFor="expense-method">결제 방법</FieldLabel><SelectField id="expense-method" value={payment.method} options={[{value:"cash",label:"현금·체크카드 (즉시 출금)"},{value:"card",label:"신용카드 (결제일 출금)"}]} onChange={(event)=>updatePayment({method:event.target.value as "cash"|"card"})} />{payment.split > 1 && <SettlementEditor payment={payment} onChange={updatePayment} today={pocket.today} />}</div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="expense-category" required>카테고리</FieldLabel><SelectField id="expense-category" value={editor.draft.category} options={pocket.data.categories.map((category) => ({ value: category, label: category }))} onChange={(event) => updateDraft({ category: event.target.value })} /></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="expense-date" required>날짜</FieldLabel><DateField id="expense-date" required max={pocket.today} value={editor.draft.date} onValueChange={(value) => { updateDraft({ date: value }); setError(""); }} /></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="expense-memo">소비 내용 <span className="text-xs">선택</span></FieldLabel><TextField id="expense-memo" maxLength={80} placeholder="예: 친구와 점심" value={editor.draft.memo} onChange={(event) => updateDraft({ memo: event.target.value })} /></div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-black-010 p-3">
            <div className="flex min-w-0 flex-col gap-1"><p id="expense-groceries-label" className="text-sm font-medium">자취 식료품 구매</p><p id="expense-groceries-hint" className="text-xs leading-150 text-black-030">켜면 이 지출을 식비 예산에도 합산해요.</p></div>
            <div className="flex shrink-0 items-center gap-2"><span className="text-xs text-black-030">{payment.groceries ? "선택됨" : "선택 안 함"}</span><Switch aria-labelledby="expense-groceries-label" aria-describedby="expense-groceries-hint" checked={payment.groceries ?? false} onCheckedChange={(checked) => updatePayment({ groceries: checked })} /></div>
          </div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="expense-note">추가 메모</FieldLabel><TextField id="expense-note" maxLength={200} placeholder="약속, 정산 관련 내용 등" value={payment.note} onChange={(event)=>updatePayment({note:event.target.value})} /></div>
          {pocket.data.isDemo && !editing && <FieldHint>첫 지출을 저장하면 예시 내역 대신 내 기록을 시작합니다.</FieldHint>}
          <FieldError>{error}</FieldError>
        </div>
        <DialogFooter><ActionButtonRow buttons={[
          ...(editing ? [{ label: "삭제", variant: "outline" as const, onClick: pocket.deleteExpense }] : []),
          { label: "저장", type: "submit" },
        ]} /></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
