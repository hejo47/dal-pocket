"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { ActionButtonRow } from "@/components/ui/action-button-row";
import { IconContainer } from "@/components/ui/icon-container";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { FieldLabel, SelectField, TextField } from "@/components/ui/form-field";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { fixedTotal, financeOf, settlementSummary, unsettledExpenses } from "@/lib/finance";
import { formatMoney, getPeriod, getPeriodExpenses, isDateKey, offsetDate, sumExpenses } from "@/lib/pocket";

import { downloadSettlementPng } from "@/lib/settlement-png";

export function ExpensesPage() {
  const params = useSearchParams();
  return <ExpenseResults key={params.toString()} month={params.get("month")} initialCategory={params.get("category")} />;
}

function ExpenseResults({ month, initialCategory }: { month: string | null; initialCategory: string | null }) {
  const pocket = usePocket();
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [exportError, setExportError] = useState(false);
  const [unsettledOnly, setUnsettledOnly] = useState(false);
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [managingCategories, setManagingCategories] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [replacementCategory, setReplacementCategory] = useState("");
  if (!pocket.ready) return <PageSkeleton />;
  const monthDate = month ? `${month}-01` : "";
  const linkedMonth = isDateKey(monthDate) && monthDate <= pocket.today;
  const mode = linkedMonth ? "monthly" : pocket.data.mode;
  const selectedDate = viewDate ?? (linkedMonth ? monthDate : pocket.today);
  const requestedCategory = categoryOverride ?? initialCategory;
  const category = requestedCategory === "전체" || (requestedCategory && pocket.data.categories.includes(requestedCategory))
    ? requestedCategory : pocket.category;
  function selectCategory(value: string) {
    setCategoryOverride(value);
    pocket.setCategory(value);
  }
  const period = getPeriod(mode, pocket.data.weekStartsOn, selectedDate);
  const periodExpenses = getPeriodExpenses(pocket.data.expenses, period);
  const filtered = unsettledOnly ? unsettledExpenses(pocket.data, category) : periodExpenses.filter((expense) => category === "전체" || expense.category === category);
  const payments = financeOf(pocket.data).payments;
  const claimRows = unsettledOnly ? filtered.map((expense) => ({
    date: expense.date,
    title: expense.memo || expense.category,
    amount: settlementSummary(payments[expense.id], expense.amount).outstanding,
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

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) { setCategoryError("카테고리 이름을 입력해주세요."); return; }
    if (pocket.data.categories.includes(name)) { setCategoryError("이미 있는 카테고리입니다."); return; }
    if (name.length > 10) { setCategoryError("카테고리는 10자 이내로 입력해주세요."); return; }
    if (!pocket.addCategory(name)) { setCategoryError("카테고리는 최대 30개까지 추가할 수 있습니다."); return; }
    setCategoryName(""); setCategoryError(""); setAddingCategory(false); selectCategory(name);
  }
  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title="지출 내역" subtitle={unsettledOnly ? "전체 기간 · 선택한 카테고리의 미정산 내역" : mode === "weekly" ? "주별로 기록을 확인할 수 있어요" : `${period.label} · ${period.scope}`} />
    <PillButton variant={unsettledOnly ? "filled" : "outline"} className="self-start" aria-pressed={unsettledOnly} onClick={() => setUnsettledOnly((value) => !value)}>미정산만 보기{unsettledOnly ? " · 전체 기간" : ""}</PillButton>
    {!unsettledOnly && <div className="flex flex-col gap-2"><FieldLabel htmlFor="view-date">조회할 날짜</FieldLabel><TextField id="view-date" type="date" max={pocket.today} value={selectedDate} onChange={(event) => { if (event.target.value) setViewDate(event.target.value); }} /></div>}
    {!unsettledOnly && mode === "weekly" && <div className="flex items-center justify-between rounded-lg border border-black-010 px-3 py-2"><PillButton aria-label="이전 주" variant="ghost" size="icon" onClick={() => setViewDate(offsetDate(period.start, -1))}><IconContainer size="slg"><ChevronLeft /></IconContainer></PillButton><span className="text-sm leading-150">{period.start.slice(0, 7)} · {period.weekNumber}주차 · {period.label}</span><PillButton aria-label="다음 주" variant="ghost" size="icon" disabled={period.end >= pocket.today} onClick={() => setViewDate(offsetDate(period.end, 1))}><IconContainer size="slg"><ChevronRight /></IconContainer></PillButton></div>}
    <div className="flex items-center justify-between gap-3"><span className="text-sm leading-150 text-black-030">{unsettledOnly ? (category === "전체" ? "전체" : category) + " 미정산 · " + filtered.length + "건" : category === "전체" ? "전체 지출" : `${category} 지출`}</span><p className="font-numbers text-2xl leading-140">{formatMoney(unsettledOnly ? outstandingTotal : sumExpenses(filtered))}원</p></div>
    {!unsettledOnly && <p className="rounded-xl border border-black-010 bg-black-002 p-3 text-sm">고정 지출 합계 (일반 지출과 별도): {formatMoney(fixedTotal(pocket.data, period.start, period.end))}원</p>}
    <section className="flex flex-col gap-3" aria-label="카테고리"><div className="flex items-center justify-between gap-2"><h2 className="text-sm leading-150">카테고리</h2><PillButton type="button" variant="ghost" size="sm" aria-pressed={managingCategories} onClick={() => setManagingCategories((value) => !value)}>{managingCategories ? "관리 완료" : "카테고리 관리"}</PillButton></div><div className="flex flex-wrap gap-2" aria-label="카테고리 필터"><PillButton variant={category === "전체" ? "filled" : "outline"} size="sm" aria-pressed={category === "전체"} onClick={() => selectCategory("전체")}>전체</PillButton>{pocket.data.categories.map((item) => <div key={item} className="flex items-center gap-1"><PillButton variant={category === item ? "filled" : "outline"} size="sm" aria-pressed={category === item} onClick={() => selectCategory(item)}>{item}</PillButton>{managingCategories && <PillButton type="button" variant="ghost" size="icon" className="text-xs" aria-label={`${item} 삭제`} disabled={pocket.data.categories.length <= 1} onClick={() => { setCategoryToDelete(item); setReplacementCategory(pocket.data.categories.find((candidate) => candidate !== item) ?? ""); }}>삭제</PillButton>}</div>)}<PillButton type="button" variant="ghost" size="sm" disabled={pocket.data.categories.length >= 30} onClick={() => { setAddingCategory((value) => !value); setCategoryError(""); }}>＋ 카테고리 추가</PillButton></div>
      {addingCategory && <form onSubmit={submitCategory} className="flex flex-col gap-2"><div className="flex gap-2"><TextField autoFocus aria-label="새 카테고리 이름" maxLength={10} placeholder="새 카테고리 이름" value={categoryName} onChange={(event) => { setCategoryName(event.target.value); setCategoryError(""); }} /><PillButton type="submit" size="sm">추가</PillButton></div>{categoryError && <p role="alert" className="text-xs leading-150 text-black-030">{categoryError}</p>}</form>}
    </section>
    <Dialog open={categoryToDelete !== null} onOpenChange={(open) => { if (!open) setCategoryToDelete(null); }}><DialogContent><DialogHeader><DialogTitle>카테고리 삭제</DialogTitle><DialogDescription>{categoryToDelete && (pocket.data.expenses.filter((expense) => expense.category === categoryToDelete).length ? `이 카테고리의 지출 ${pocket.data.expenses.filter((expense) => expense.category === categoryToDelete).length}건을 아래 카테고리로 옮긴 뒤 삭제합니다.` : "이 카테고리를 목록에서 삭제합니다.")}</DialogDescription></DialogHeader>{categoryToDelete && pocket.data.expenses.some((expense) => expense.category === categoryToDelete) && <div className="flex flex-col gap-2"><FieldLabel htmlFor="replacement-category" required>기록을 옮길 카테고리</FieldLabel><SelectField id="replacement-category" value={replacementCategory} options={pocket.data.categories.filter((item) => item !== categoryToDelete).map((item) => ({ value: item, label: item }))} onChange={(event) => setReplacementCategory(event.target.value)} /></div>}<DialogFooter><ActionButtonRow buttons={[{ label: "취소", variant: "outline", onClick: () => setCategoryToDelete(null) }, { label: "삭제", disabled: !categoryToDelete, onClick: () => { if (categoryToDelete && pocket.deleteCategory(categoryToDelete, replacementCategory)) { setCategoryToDelete(null); setManagingCategories(false); } } }]} /></DialogFooter></DialogContent></Dialog>
    {unsettledOnly && !filtered.length ? <p className="rounded-xl bg-black-002 p-4 text-sm">이 카테고리의 미정산 내역이 없습니다.</p> : <ExpenseList expenses={filtered} grouped />}
    {unsettledOnly && claimRows.length > 0 && <div className="flex flex-col gap-2">
      <PillButton type="button" onClick={exportClaims}>미수금 내역 PNG 내려받기</PillButton>
      {exportError && <p role="alert" className="text-sm text-red-2">이미지를 만들지 못했어요. 카테고리별로 나눠 다시 시도해주세요.</p>}
    </div>}
  </div>;
}
