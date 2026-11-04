"use client";

import { useState } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { IconButton } from "@/components/ui/icon-button";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { IconContainer } from "@/components/ui/icon-container";
import { usePocket } from "@/components/providers/pocket-provider";
import { DateField, FieldLabel, FieldHint, SelectField, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { financeOf, fixedDueDate } from "@/lib/finance";
import type { FixedExpense } from "@/lib/finance";
import { formatMoney, parseAmount, validAmount } from "@/lib/pocket";

function SessionRecords({ item }: { item: FixedExpense }) {
  const pocket = usePocket();
  const [date, setDate] = useState(pocket.today);
  const finance = financeOf(pocket.data);
  const count = item.sessionsPerPayment ?? 4;
  const attended = item.sessionDates ?? [];
  const paid = item.paymentDates ?? [];
  const remaining = paid.length * count - attended.length;
  const validDate = date >= item.date && date <= pocket.today;
  function update(patch: Partial<FixedExpense>) {
    pocket.saveFinance({ ...finance, fixedExpenses: (finance.fixedExpenses ?? []).map((entry) => entry.id === item.id ? { ...entry, ...patch } : entry) });
  }
  return <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-black-002 p-3">
    <p className="text-sm">결제 {paid.length}회 · 수강 {attended.length}회 · 남은 {remaining}회</p>
    <FieldLabel htmlFor={"session-date-" + item.id}>수강·결제 기록 날짜</FieldLabel>
    <DateField id={"session-date-" + item.id} min={item.date} max={pocket.today} value={date} onValueChange={(value) => setDate(value)} />
    <div className="flex flex-wrap gap-2"><PillButton variant="outline" size="sm" disabled={!validDate || remaining <= 0} onClick={() => update({ sessionDates: [...attended, date] })}>수강 1회 기록</PillButton><PillButton size="sm" disabled={!validDate || remaining > 0} onClick={() => update({ paymentDates: [...paid, date] })}>다음 {count}회분 결제 기록</PillButton>{attended.length > 0 && <PillButton variant="outline" size="sm" onClick={() => update({ sessionDates: attended.slice(0, -1) })}>최근 수강 취소</PillButton>}</div>
    <details><summary className="cursor-pointer py-2 text-xs">수강·결제 기록 보기</summary><p className="break-words text-xs leading-160">결제일: {paid.join(", ") || "없음"}</p><p className="break-words text-xs leading-160">수강일: {attended.join(", ") || "없음"}</p></details>
    <FieldHint>결제 기록을 추가할 때만 금액을 반영합니다. 실제 카드 결제나 송금을 실행하는 버튼은 아닙니다.</FieldHint>
  </div>;
}

export function FixedExpenses({ month }: { month: string }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const items = finance.fixedExpenses ?? [];
  const [expanded, setExpanded] = useState(false);
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const editing = items.find((item) => item.id === activeForm);
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(pocket.today);
  const [endMonth, setEndMonth] = useState("");
  const [method, setMethod] = useState<"cash" | "card">("cash");
  const [cadence, setCadence] = useState<"monthly" | "sessions">("monthly");
  const [sessions, setSessions] = useState("4");
  const methodOptions = [{ value: "cash", label: "현금·체크카드 (즉시 출금)" }, { value: "card", label: "신용카드 (카드 결제일 출금)" }];
  function openForm(item?: FixedExpense) {
    setExpanded(true);
    setMemo(item?.memo ?? "");
    setAmount(item ? String(item.amount) : "");
    setDate(item?.date ?? pocket.today);
    setEndMonth(item?.endMonth ?? "");
    setMethod(item?.method ?? "cash");
    setCadence(item?.cadence ?? "monthly");
    setSessions(String(item?.sessionsPerPayment ?? 4));
    setActiveForm(item?.id ?? "");
  }

  const form = <form className="flex min-w-0 flex-col gap-3 rounded-lg bg-black-002 p-3" onSubmit={(event) => {
      event.preventDefault();
      const parsed = parseAmount(amount);
      if (!validAmount(parsed) || cadence === "monthly" && endMonth && endMonth < date.slice(0, 7)) return;
      const item: FixedExpense = { id: editing?.id ?? crypto.randomUUID(), date, amount: parsed, memo, method, cadence, includeInBudget: editing?.includeInBudget ?? false };
      if (cadence === "monthly") item.endMonth = endMonth || undefined;
      else { item.sessionsPerPayment = Number(sessions); item.sessionDates = editing?.sessionDates ?? []; item.paymentDates = editing?.paymentDates ?? [date]; }
      pocket.saveFinance({ ...finance, fixedExpenses: editing ? items.map((entry) => entry.id === editing.id ? item : entry) : [...items, item] });
      setActiveForm(null);
    }}>
      <FieldLabel htmlFor="fixed-name" required>내역 이름</FieldLabel><TextField id="fixed-name" required maxLength={80} value={memo} placeholder="월세, 구독료, 학원비 등" onChange={(event) => setMemo(event.target.value)} />
      <FieldLabel htmlFor="fixed-cadence">결제 기준</FieldLabel><SelectField id="fixed-cadence" disabled={Boolean(editing)} value={cadence} options={[{ value: "monthly", label: "매달 같은 날짜" }, { value: "sessions", label: "수강 횟수 단위로 선불 결제" }]} onChange={(event) => setCadence(event.target.value as typeof cadence)} />
      {cadence === "sessions" && <><FieldLabel htmlFor="fixed-sessions">한 번 결제로 이용할 횟수</FieldLabel><TextField id="fixed-sessions" disabled={Boolean(editing)} type="number" min={1} max={100} required value={sessions} onChange={(event) => setSessions(event.target.value)} /></>}
      <FieldLabel htmlFor="fixed-amount" required>{cadence === "monthly" ? "매달 지출 금액" : "한 번 결제하는 금액"}</FieldLabel><TextField id="fixed-amount" required inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
      <FieldLabel htmlFor="fixed-method">결제 수단</FieldLabel><SelectField id="fixed-method" value={method} options={methodOptions} onChange={(event) => setMethod(event.target.value as typeof method)} />
      <FieldLabel htmlFor="fixed-date" required>{cadence === "monthly" ? "첫 결제일 · 매달 같은 날짜에 반복" : "첫 선불 결제일"}</FieldLabel><DateField id="fixed-date" disabled={editing?.cadence === "sessions"} required value={date} onValueChange={(value) => setDate(value)} />
      {cadence === "monthly" && <><FieldLabel htmlFor="fixed-end">마지막 적용 월 · 선택</FieldLabel><DateField id="fixed-end" mode="month" min={date.slice(0, 7)} value={endMonth} onValueChange={setEndMonth} /></>}
      <FieldHint>생활 예산에서 제외하고 별도 합계로 표시합니다. 현금은 결제일, 신용카드는 설정한 카드 결제일에 출금합니다. {cadence === "sessions" ? "등록 시 첫 결제 1건이 기록됩니다. 이후 수강 횟수를 기록하고 모두 쓰면 다음 결제를 추가하세요." : "29~31일이 없는 달은 말일에 적용합니다."}</FieldHint><div className="flex flex-wrap gap-2">
        <PillButton type="submit">{editing ? "수정 저장" : "고정 내역 저장"}</PillButton>
        <PillButton type="button" variant="outline" onClick={() => setActiveForm(null)}>취소</PillButton>
      </div>
    </form>;

  return <SectionCard title="고정 지출" expanded={expanded} onToggle={() => setExpanded(!expanded)} action={<IconButton label={activeForm === "" ? "고정 내역 등록 닫기" : "고정 내역 추가"} onClick={() => activeForm === "" ? setActiveForm(null) : openForm()}>{activeForm === "" ? <X /> : <Plus />}</IconButton>}>
    {activeForm === "" && form}
    {items.length ? items.map((item) => <div key={item.id} className="flex min-w-0 flex-col gap-3 border-t border-black-010 py-3"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 flex-col gap-1"><p className="break-words text-sm">{item.memo}</p><p className="font-numbers text-sm">{item.cadence === "sessions" ? (item.sessionsPerPayment ?? 4) + "회분" : "매월"} <strong className="text-base font-semibold">{formatMoney(item.amount)}원</strong></p><p className="text-xs leading-160 text-black-030">{item.date}부터 {item.cadence === "sessions" ? "수강 횟수로 관리" : item.endMonth ? item.endMonth + "까지" : "반복"} · 생활 예산 제외</p>{item.cadence !== "sessions" && <p className="text-xs text-black-030">{fixedDueDate(item, month) ? month + " 카드 사용·현금 결제일: " + fixedDueDate(item, month) : month + "에는 적용되지 않음"}</p>}</div><div className="flex shrink-0 gap-1">
      <PillButton type="button" variant="ghost" size="icon" aria-label={item.memo + " 수정"} title="수정" aria-expanded={activeForm === item.id} onClick={() => activeForm === item.id ? setActiveForm(null) : openForm(item)}><IconContainer><Pencil /></IconContainer></PillButton>
      <PillButton type="button" variant="ghost" size="icon" aria-label={item.memo + " 삭제"} title="삭제" onClick={() => {
        if (!window.confirm(item.memo + " 고정 내역을 삭제할까요?")) return;
        pocket.saveFinance({ ...finance, fixedExpenses: items.filter((entry) => entry.id !== item.id) });
        if (activeForm === item.id) setActiveForm(null);
      }}><IconContainer><Trash2 /></IconContainer></PillButton>
    </div></div>
      <p className="text-xs text-black-030">{item.method === "card" ? "신용카드" : "현금·체크카드"}</p>
      {activeForm === item.id && form}
      {item.cadence === "sessions" && <SessionRecords item={item} />}
    </div>) : <FieldHint>등록된 고정 내역이 없습니다.</FieldHint>}
  </SectionCard>;
}
