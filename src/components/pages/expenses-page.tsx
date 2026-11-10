"use client";

import { PeriodPicker } from "@/components/ui/period-picker";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { SignInNotice } from "@/components/ui/sign-in-notice";
import { CategoryManager } from "@/components/pages/category-manager";
import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { PillButton } from "@/components/ui/pill-button";
import { Switch } from "@/components/ui/switch";
import { FieldLabel } from "@/components/ui/form-field";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { financeOf, settlementSummary, payableSummary } from "@/lib/finance";
import { CATEGORIES, formatMoney, getPeriod, getPeriodExpenses, isDateKey, sumExpenses } from "@/lib/pocket";

import { downloadSettlementPng } from "@/lib/settlement-png";

export function ExpensesPage() {
  const params = useSearchParams();
  return <ExpenseResults key={params.toString()} month={params.get("month")} initialDate={params.get("date")} initialCategory={params.get("category")} initialDirection={params.get("settlement")} />;
}

export function ExpensesPreview({ checking }: { checking: boolean }) {
  return <ExpenseResults month={null} initialCategory={null} masked checking={checking} />;
}

function ExpenseResults({ month, initialDate, initialCategory, initialDirection, masked = false, checking = false }: { month: string | null; initialDate?: string | null; initialCategory: string | null; initialDirection?: string | null; masked?: boolean; checking?: boolean }) {
  const pocket = usePocket();
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [exportError, setExportError] = useState(false);
  const [unsettledOnly, setUnsettledOnly] = useState(initialDirection === "payable" || initialDirection === "receivable");
  const [direction, setDirection] = useState<"receivable" | "payable">(initialDirection === "payable" ? "payable" : "receivable");
  const [viewDate, setViewDate] = useState<string | null>(null);
  if (!pocket.ready) return <PageSkeleton />;
  const monthDate = month ? `${month}-01` : "";
  const linkedMonth = isDateKey(monthDate) && monthDate <= pocket.today;
  const mode = linkedMonth ? "monthly" : pocket.data.mode;
  const selectedDate = viewDate ?? (linkedMonth ? monthDate : isDateKey(initialDate) && initialDate <= pocket.today ? initialDate : pocket.today);
  const categories: readonly string[] = masked ? CATEGORIES : pocket.data.categories;
  const requestedCategory = categoryOverride ?? initialCategory;
  const category = requestedCategory === "전체" || (requestedCategory && categories.includes(requestedCategory))
    ? requestedCategory : masked ? "전체" : pocket.category;
  function selectCategory(value: string) {
    setCategoryOverride(value);
    if (!masked) pocket.setCategory(value);
  }
  const period = getPeriod(mode, pocket.data.weekStartsOn, selectedDate);
  const daily = !linkedMonth && pocket.dailyView;
  const periodExpenses = getPeriodExpenses(pocket.data.expenses, daily ? { start: selectedDate, end: selectedDate } : period);
  const payments = financeOf(pocket.data).payments;
  const filtered = masked ? [] : periodExpenses.filter((expense) => {
    if (category !== "전체" && expense.category !== category) return false;
    if (!unsettledOnly) return true;
    const payment = payments[expense.id];
    return Boolean(payment && (direction === "payable" ? payableSummary(payment, expense.amount) : settlementSummary(payment, expense.amount)).outstanding > 0);
  });
  const claimRows = unsettledOnly ? filtered.map((expense) => ({
    date: expense.date,
    title: expense.memo || expense.category,
    amount: (direction === "payable" ? payableSummary(payments[expense.id], expense.amount) : settlementSummary(payments[expense.id], expense.amount)).outstanding,
  })) : [];
  const outstandingTotal = claimRows.reduce((sum, row) => sum + row.amount, 0);

  async function exportClaims() {
    setExportError(false);
    try {
      await downloadSettlementPng(claimRows, category, pocket.today);
    } catch {
      setExportError(true);
    }
  }

  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title="지출 내역" />
    <PeriodPicker mode={daily ? "daily" : mode} date={selectedDate} maxDate={pocket.today} weekStartsOn={pocket.data.weekStartsOn} onChange={setViewDate} />
    <section className="flex flex-col gap-3" aria-label="카테고리">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm leading-150">카테고리</h2>
        {!masked && <CategoryManager onAdded={selectCategory} onDeleted={(name) => { if (category === name) selectCategory("전체"); }} />}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="카테고리 필터">
        {["전체", ...categories].map((item) => <PillButton key={item} variant={category === item ? "filled" : "ghost"} size="sm"
          className={`rounded-full shadow-none ${category === item ? "" : "bg-black-002"}`}
          aria-pressed={category === item} onClick={() => selectCategory(item)}>{item}</PillButton>)}
      </div>
    </section>
    <div className="flex items-center gap-2">
      <Switch id="unsettled-only" checked={unsettledOnly} onCheckedChange={setUnsettledOnly} />
      <FieldLabel htmlFor="unsettled-only" className="cursor-pointer">미정산만 보기</FieldLabel>
    </div>
    {unsettledOnly && <div className="flex gap-2" aria-label="정산 구분">{(["receivable", "payable"] as const).map((value) => <PillButton key={value} variant={direction === value ? "filled" : "ghost"} size="sm" aria-pressed={direction === value} onClick={() => setDirection(value)}>{value === "receivable" ? "받을 정산" : "보낼 정산"}</PillButton>)}</div>}
    <div className="flex items-center justify-between gap-3"><span className="text-sm leading-150 text-black-030">{unsettledOnly ? (category === "전체" ? "전체" : category) + (direction === "payable" ? " 보낼 정산 · " : " 받을 정산 · ") + (masked ? "??" : filtered.length) + "건" : category === "전체" ? "전체 지출" : `${category} 지출`}</span><p className="font-numbers text-2xl leading-140">{masked ? "??" : formatMoney(unsettledOnly ? outstandingTotal : sumExpenses(filtered))}원</p></div>
    {masked ? <SignInNotice checking={checking}>로그인하면 지출과 미정산 내역을 볼 수 있어요.</SignInNotice> : unsettledOnly && !filtered.length ? <p className="rounded-xl bg-black-002 p-4 text-sm">이 카테고리의 미정산 내역이 없습니다.</p> : <ExpenseList expenses={filtered} grouped />}
    {unsettledOnly && direction === "receivable" && claimRows.length > 0 && <div className="flex flex-col gap-2">
      <PillButton type="button" onClick={exportClaims}>미수금 내역 PNG 내려받기</PillButton>
      {exportError && <p role="alert" className="text-sm text-red-2">이미지를 만들지 못했어요. 카테고리별로 나눠 다시 시도해주세요.</p>}
    </div>}
  </div>;
}
