"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { usePocket } from "@/components/providers/pocket-provider";
import { SectionCard } from "@/components/ui/section-card";
import { IconButton } from "@/components/ui/icon-button";
import { RecordRemoveButton } from "@/components/ui/record-remove-button";
import { PillButton } from "@/components/ui/pill-button";
import { DateField, FieldError, FieldHint, FieldLabel, TextField } from "@/components/ui/form-field";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { financeOf, installmentDue, installmentSummary } from "@/lib/finance";
import type { Installment } from "@/lib/finance";
import { formatMoney, isDateKey, parseAmount, validAmount } from "@/lib/pocket";

const monthLabel = (month: string) => `${Number(month.slice(0, 4))}년 ${Number(month.slice(5))}월`;

export function InstallmentsSection({ month }: { month: string }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstMonth, setFirstMonth] = useState(month);
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("3");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const total = finance.installments.reduce((sum, item) => sum + installmentDue(item, month), 0);
  const visible = finance.installments.filter((item) => showAll || installmentSummary(item, month).status === "active");
  function openForm(item?: Installment) {
    setEditingId(item?.id ?? null);
    setFirstMonth(item?.date.slice(0, 7) ?? month);
    setAmount(item ? String(item.amount) : "");
    setMonths(String(item?.months ?? 3));
    setMemo(item?.memo ?? "");
    setError("");
    setOpen(true);
  }
  return <SectionCard title="할부 내역" summary={{ label: "이달 할부 납부", amount: total }} action={<IconButton label="할부 등록" onClick={() => openForm()}><Plus /></IconButton>}>
    <FieldHint>회차는 첫 납부 월부터 계산한 일정 기준입니다. 남은 원금은 선택한 달 납부분을 제외한 금액이며, 실제 납부 확인 상태는 아닙니다.</FieldHint>
    {visible.map((item) => {
      const summary = installmentSummary(item, month);
      return <div key={item.id} className="flex items-start justify-between gap-2 border-t border-black-010 py-3">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="break-words text-sm font-semibold">{item.memo || "할부"}</p>
          <p className="text-xs text-black-030">{summary.status === "active" ? `${Number(month.slice(5))}월 · ${summary.round}/${item.months}회차` : summary.status === "upcoming" ? "납부 시작 전" : "납부 일정 종료"}</p>
          <p className="font-numbers text-base font-semibold">{formatMoney(summary.due)}원<span className="ml-1 text-xs font-normal text-black-030">이번 달 납부</span></p>
          <p className="text-xs leading-160 text-black-030">총 원금 {formatMoney(item.amount)}원 · {item.months}개월<br />첫 납부 {monthLabel(summary.firstMonth)} · 마지막 {monthLabel(summary.lastMonth)}<br />이달 이후 {summary.remainingMonths}회 · 남은 원금 {formatMoney(summary.remainingAmount)}원</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <IconButton label={`${item.memo || "할부"} 수정`} onClick={() => openForm(item)}><Pencil /></IconButton>
          <RecordRemoveButton label={`${item.memo || "할부"} 삭제`} onClick={() => {
            if (window.confirm(`${item.memo || "할부"} 내역을 삭제할까요?`)) pocket.saveFinance({ ...finance, installments: finance.installments.filter((entry) => entry.id !== item.id) });
          }} />
        </div>
      </div>;
    })}
    {!visible.length && <FieldHint>{showAll ? "등록된 할부가 없습니다." : "이달 납부할 할부가 없습니다."}</FieldHint>}
    {finance.installments.length > 0 && <PillButton variant="ghost" size="sm" className="self-start" aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? "이달 할부만 보기" : "시작 전·종료된 할부도 보기"}</PillButton>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent><DialogHeader><DialogTitle>{editingId ? "할부 수정" : "할부 등록"}</DialogTitle><DialogDescription>첫 납부 월과 원금·개월 수로 회차별 금액을 계산합니다.</DialogDescription></DialogHeader>
        <form className="pocket-dialog-scroll flex flex-col gap-3" onSubmit={(event) => {
          event.preventDefault();
          const parsed = parseAmount(amount), count = Number(months);
          if (!validAmount(parsed) || !isDateKey(firstMonth + "-01") || !Number.isInteger(count) || count < 2 || count > 60) { setError("첫 납부 월, 원금과 할부 개월 수(2~60개월)를 확인해주세요."); return; }
          const original = finance.installments.find((item) => item.id === editingId);
          if (editingId && !original) { setError("삭제된 내역입니다. 닫고 다시 확인해주세요."); return; }
          const item: Installment = { ...original, id: editingId ?? crypto.randomUUID(), date: original?.date.startsWith(firstMonth) ? original.date : firstMonth + "-01", amount: parsed, months: count, memo: memo.trim() };
          pocket.saveFinance({ ...finance, installments: editingId ? finance.installments.map((entry) => entry.id === editingId ? item : entry) : [...finance.installments, item] });
          setOpen(false);
        }}>
          <FieldLabel htmlFor="installment-first-month" required>첫 납부 월</FieldLabel><DateField id="installment-first-month" mode="month" required value={firstMonth} onValueChange={setFirstMonth} />
          <FieldLabel htmlFor="installment-total" required>할부 원금 총액</FieldLabel><TextField id="installment-total" required inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 9))} />
          <FieldLabel htmlFor="installment-count" required>전체 할부 개월 수</FieldLabel><TextField id="installment-count" type="number" required min={2} max={60} value={months} onChange={(event) => setMonths(event.target.value)} />
          <FieldLabel htmlFor="installment-memo">내용·메모</FieldLabel><TextField id="installment-memo" maxLength={80} value={memo} onChange={(event) => setMemo(event.target.value)} />
          <FieldHint>무이자 원금을 개월별로 배분합니다. 납부일은 현금·카드 설정의 카드 결제일을 따릅니다. 수정하면 과거·이후 월의 납부액과 현금 흐름도 다시 계산됩니다.</FieldHint>
          <FieldError>{error}</FieldError><PillButton type="submit">{editingId ? "수정 저장" : "등록"}</PillButton>
        </form>
      </DialogContent>
    </Dialog>
  </SectionCard>;
}
