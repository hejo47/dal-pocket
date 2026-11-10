"use client";

import { useState } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { IconButton } from "@/components/ui/icon-button";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { IconContainer } from "@/components/ui/icon-container";
import { usePocket } from "@/components/providers/pocket-provider";
import { DateField, FieldLabel, FieldHint, FieldError, SelectField, TextField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { financeOf, fixedDueDate, changeSessionStart, fixedCharges } from "@/lib/finance";
import type { FixedExpense } from "@/lib/finance";
import { formatMoney, parseAmount, validAmount, shortDate, getPeriod } from "@/lib/pocket";

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
    {!validDate && <FieldHint>{date < item.date ? `첫 결제일(${shortDate(item.date)})부터 수강·결제를 기록할 수 있어요.` : "오늘까지의 날짜로 기록해주세요."}</FieldHint>}
    <div className="flex flex-wrap gap-2"><PillButton variant="outline" size="sm" disabled={!validDate || remaining <= 0} onClick={() => update({ sessionDates: [...attended, date] })}>수강 1회 기록</PillButton><PillButton size="sm" disabled={!validDate} onClick={() => update({ paymentDates: [...paid, date] })}>다음 {count}회분 결제 기록</PillButton>{paid.length > 1 && (paid.length - 1) * count >= attended.length && <PillButton variant="outline" size="sm" onClick={() => update({ paymentDates: paid.slice(0, -1) })}>최근 결제 기록 취소</PillButton>}{attended.length > 0 && <PillButton variant="outline" size="sm" onClick={() => update({ sessionDates: attended.slice(0, -1) })}>최근 수강 취소</PillButton>}</div>
    <FieldHint>남은 횟수와 관계없이 실제로 다음 회차를 결제했을 때 기록할 수 있어요.</FieldHint>
    <details><summary className="cursor-pointer py-2 text-xs">수강·결제 기록 보기</summary><p className="break-words text-xs leading-160">결제일: {paid.join(", ") || "없음"}</p><p className="break-words text-xs leading-160">수강일: {attended.join(", ") || "없음"}</p></details>
    <FieldHint>결제 기록을 추가할 때만 금액을 반영합니다. 실제 카드 결제나 송금을 실행하는 버튼은 아닙니다.</FieldHint>
  </div>;
}

export function FixedExpenses({ month, kind }: { month: string; kind?: "utilities" }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const allItems = finance.fixedExpenses ?? [];
  const utilities = kind === "utilities";
  const title = utilities ? "공과금" : "고정 지출";
  const items = allItems.filter((item) => utilities ? item.kind === "utilities" && item.date.slice(0, 7) === month : item.kind !== "utilities");
  const monthEnd = getPeriod("monthly", 1, month + "-01").end;
  const monthlyTotal = items.reduce((sum, item) => sum + fixedCharges(item, month + "-01", monthEnd).length * item.amount, 0);
  const [expanded, setExpanded] = useState(utilities);
  const [error, setError] = useState("");
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
    setError("");
    setExpanded(true);
    setMemo(item?.memo ?? "");
    setAmount(item ? String(item.amount) : "");
    setDate(item?.date ?? (utilities && !pocket.today.startsWith(month) ? month + "-01" : pocket.today));
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
      if (utilities) { item.kind = "utilities"; item.cadence = "monthly"; item.endMonth = date.slice(0, 7); item.includeInBudget = false; }
      else if (cadence === "monthly") item.endMonth = endMonth || undefined;
      else {
        try {
          const history = editing ? changeSessionStart(editing, date) : { sessionDates: [], paymentDates: [date] };
          item.sessionsPerPayment = Number(sessions);
          item.sessionDates = history.sessionDates ?? [];
          item.paymentDates = history.paymentDates ?? [date];
        } catch {
          setError("첫 결제일은 이미 등록한 수강·결제 날짜보다 뒤로 옮길 수 없어요.");
          return;
        }
      }
      pocket.saveFinance({ ...finance, fixedExpenses: editing ? allItems.map((entry) => entry.id === editing.id ? item : entry) : [...allItems, item] });
      setActiveForm(null);
    }}>
      <FieldLabel htmlFor={`${kind ?? "fixed"}-name`} required>{utilities ? "공과금 이름" : "내역 이름"}</FieldLabel><TextField id={`${kind ?? "fixed"}-name`} required maxLength={80} value={memo} placeholder={utilities ? "전기, 가스, 수도, 관리비 등" : "월세, 구독료, 학원비 등"} onChange={(event) => setMemo(event.target.value)} />
      {!utilities && <><FieldLabel htmlFor={`${kind ?? "fixed"}-cadence`}>결제 기준</FieldLabel><SelectField id={`${kind ?? "fixed"}-cadence`} disabled={Boolean(editing)} value={cadence} options={[{ value: "monthly", label: "매달 같은 날짜" }, { value: "sessions", label: "수강 횟수 단위로 선불 결제" }]} onChange={(event) => setCadence(event.target.value as typeof cadence)} /></>}
      {cadence === "sessions" && <><FieldLabel htmlFor={`${kind ?? "fixed"}-sessions`}>한 번 결제로 이용할 횟수</FieldLabel><TextField id={`${kind ?? "fixed"}-sessions`} disabled={Boolean(editing)} type="number" min={1} max={100} required value={sessions} onChange={(event) => setSessions(event.target.value)} /></>}
      <FieldLabel htmlFor={`${kind ?? "fixed"}-amount`} required>{utilities ? "이번 달 금액" : cadence === "monthly" ? "매달 지출 금액" : "한 번 결제하는 금액"}</FieldLabel><TextField id={`${kind ?? "fixed"}-amount`} required inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
      <FieldLabel htmlFor={`${kind ?? "fixed"}-method`}>결제 수단</FieldLabel><SelectField id={`${kind ?? "fixed"}-method`} value={method} options={methodOptions} onChange={(event) => setMethod(event.target.value as typeof method)} />
      <FieldLabel htmlFor={`${kind ?? "fixed"}-date`} required>{utilities ? "결제 날짜" : cadence === "monthly" ? "첫 결제일 · 매달 같은 날짜에 반복" : "첫 선불 결제일"}</FieldLabel><DateField id={`${kind ?? "fixed"}-date`} required min={utilities ? month + "-01" : undefined} max={utilities ? monthEnd : undefined} value={date} onValueChange={(value) => setDate(value)} />
      {cadence === "sessions" && editing && <FieldHint>첫 결제일을 바꾸면 최초 결제 기록의 날짜도 함께 수정합니다. 이후 수강·결제 기록은 유지해요.</FieldHint>}
      <FieldError>{error}</FieldError>
      {!utilities && cadence === "monthly" && <><FieldLabel htmlFor={`${kind ?? "fixed"}-end`}>마지막 적용 월 · 선택</FieldLabel><DateField id={`${kind ?? "fixed"}-end`} mode="month" min={date.slice(0, 7)} value={endMonth} onValueChange={setEndMonth} /></>}
      <FieldHint>생활 예산에서 제외하고 별도 합계로 표시합니다. 현금은 결제일, 신용카드는 설정한 카드 결제일에 출금합니다. {utilities ? "해당 월에만 반영하며 다음 달로 자동 반복하지 않습니다." : cadence === "sessions" ? "등록 시 첫 결제 1건이 기록됩니다. 이후 수강 횟수를 기록하고 모두 쓰면 다음 결제를 추가하세요." : "29~31일이 없는 달은 말일에 적용합니다."}</FieldHint><div className="flex flex-wrap gap-2">
        <PillButton type="submit">{editing ? "수정 저장" : utilities ? "공과금 저장" : "고정 내역 저장"}</PillButton>
        <PillButton type="button" variant="outline" onClick={() => setActiveForm(null)}>취소</PillButton>
      </div>
    </form>;

  return <SectionCard title={title} summary={utilities ? { label: "이달 공과금", amount: monthlyTotal } : undefined} expanded={expanded} onToggle={() => setExpanded(!expanded)} action={<IconButton label={activeForm === "" ? `${title} 등록 닫기` : `${title} 추가`} onClick={() => activeForm === "" ? setActiveForm(null) : openForm()}>{activeForm === "" ? <X /> : <Plus />}</IconButton>}>
    {activeForm === "" && form}
    {items.length ? items.map((item) => <div key={item.id} className="flex min-w-0 flex-col gap-3 border-t border-black-010 py-3"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 flex-col gap-1"><p className="break-words text-sm">{item.memo}</p><p className="font-numbers text-sm">{utilities ? shortDate(item.date) : item.cadence === "sessions" ? (item.sessionsPerPayment ?? 4) + "회분" : "매월"} <strong className="text-base font-semibold">{formatMoney(item.amount)}원</strong></p>{!utilities && <p className="text-xs leading-160 text-black-030">{item.date}부터 {item.cadence === "sessions" ? "수강 횟수로 관리" : item.endMonth ? item.endMonth + "까지" : "반복"} · 생활 예산 제외</p>}{!utilities && item.cadence !== "sessions" && <p className="text-xs text-black-030">{fixedDueDate(item, month) ? month + " 카드 사용·현금 결제일: " + fixedDueDate(item, month) : month + "에는 적용되지 않음"}</p>}</div><div className="flex shrink-0 gap-1">
      <PillButton type="button" variant="ghost" size="icon" aria-label={item.memo + " 수정"} title="수정" aria-expanded={activeForm === item.id} onClick={() => activeForm === item.id ? setActiveForm(null) : openForm(item)}><IconContainer><Pencil /></IconContainer></PillButton>
      <PillButton type="button" variant="ghost" size="icon" aria-label={item.memo + " 삭제"} title="삭제" onClick={() => {
        if (!window.confirm(item.memo + (utilities ? " 공과금을 삭제할까요?" : " 고정 내역을 삭제할까요?"))) return;
        pocket.saveFinance({ ...finance, fixedExpenses: allItems.filter((entry) => entry.id !== item.id) });
        if (activeForm === item.id) setActiveForm(null);
      }}><IconContainer><Trash2 /></IconContainer></PillButton>
    </div></div>
      <p className="text-xs text-black-030">{item.method === "card" ? "신용카드" : "현금·체크카드"}</p>
      {activeForm === item.id && form}
      {item.cadence === "sessions" && <SessionRecords item={item} />}
    </div>) : <FieldHint>{utilities ? "이번 달 등록된 공과금이 없습니다." : "등록된 고정 내역이 없습니다."}</FieldHint>}
  </SectionCard>;
}
