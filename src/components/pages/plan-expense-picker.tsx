"use client";

import { useState } from "react";
import { usePocket } from "@/components/providers/pocket-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Checkbox, DateField, FieldLabel, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { financeOf } from "@/lib/finance";
import type { PlanEntry } from "@/lib/finance";
import { formatMoney, shortDate } from "@/lib/pocket";

export function PlanExpensePicker({ plan, onClose }: { plan: PlanEntry; onClose: () => void }) {
  const pocket = usePocket();
  const [date, setDate] = useState(plan.date);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set((plan.expenseIds ?? []).filter((id) => pocket.data.expenses.some((expense) => expense.id === id))));
  const [visible, setVisible] = useState(50);
  const [error, setError] = useState("");
  const otherPlans = financeOf(pocket.data).plans.filter((entry) => entry.id !== plan.id);
  const occupied = new Set(otherPlans.flatMap((entry) => entry.expenseIds ?? []));
  const matches = pocket.data.expenses.filter((expense) => (!date || expense.date === date) && `${expense.memo} ${expense.category}`.includes(query.trim())).sort((a, b) => b.date.localeCompare(a.date));
  const total = pocket.data.expenses.filter((expense) => selected.has(expense.id)).reduce((sum, expense) => sum + expense.amount, 0);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent aria-describedby="plan-expense-description">
      <DialogHeader><DialogTitle>약속에 지출 연결</DialogTitle><DialogDescription id="plan-expense-description">{plan.memo || "약속"} · {shortDate(plan.date)}. 이미 기록한 지출을 여러 건 선택하세요. 지출은 새로 생성하지 않아요.</DialogDescription></DialogHeader>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2"><FieldLabel>조회 날짜</FieldLabel><PillButton size="sm" variant="ghost" onClick={() => { setDate(date ? "" : plan.date); setVisible(50); }}>{date ? "전체 날짜" : "약속 날짜만"}</PillButton></div>
        {date && <DateField value={date} onValueChange={(next) => { setDate(next); setVisible(50); }} aria-label="지출 조회 날짜" max={pocket.today} />}
        <TextField aria-label="연결할 지출 검색" placeholder="소비 내용·카테고리 검색" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(50); }} />
      </div>
      <div className="pocket-dialog-scroll flex flex-col gap-2">
        {matches.slice(0, visible).map((expense) => <label key={expense.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-black-010 p-3">
          <Checkbox checked={selected.has(expense.id)} disabled={occupied.has(expense.id)} aria-label={`${expense.memo || expense.category} 선택`} onCheckedChange={(checked) => setSelected((current) => { const next = new Set(current); if (checked) next.add(expense.id); else next.delete(expense.id); return next; })} />
          <span className="flex min-w-0 flex-1 flex-col gap-1"><span className="break-words text-sm font-semibold">{expense.memo || expense.category}</span><span className="text-xs text-black-030">{shortDate(expense.date)} · {expense.category}{occupied.has(expense.id) ? " · 다른 약속에 연결됨" : ""}</span></span>
          <span className="font-numbers shrink-0 text-sm font-semibold">{formatMoney(expense.amount)}원</span>
        </label>)}
        {!matches.length && <p className="py-3 text-sm text-black-030">해당하는 지출이 없어요. 다른 날짜를 선택하거나 전체 날짜로 확인해주세요.</p>}
        {matches.length > visible && <PillButton size="sm" variant="outline" onClick={() => setVisible(visible + 50)}>더보기</PillButton>}
      </div>
      <p className="text-sm">선택 {selected.size}건 · 본인 부담액 합계 <span className="font-numbers font-semibold">{formatMoney(total)}원</span></p>
      {error && <p role="alert" className="text-xs text-red-2">{error}</p>}
      <DialogFooter><DialogClose asChild><PillButton variant="outline">취소</PillButton></DialogClose><PillButton onClick={() => { if (pocket.savePlanLinks(plan.id, [...selected])) onClose(); else setError("내역이 변경됐어요. 다시 확인해주세요."); }}>연결 저장</PillButton></DialogFooter>
    </DialogContent>
  </Dialog>;
}
