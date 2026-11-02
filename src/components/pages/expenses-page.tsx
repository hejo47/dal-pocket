"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { ExpenseList } from "@/components/pages/expense-list";
import { usePocket } from "@/components/providers/pocket-provider";
import { ActionButtonRow } from "@/components/ui/action-button-row";
import { IconContainer } from "@/components/ui/icon-container";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { FieldLabel, SelectField, TextField } from "@/components/ui/form-field";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { formatMoney, getPeriod, getPeriodExpenses, offsetDate, sumExpenses } from "@/lib/pocket";

export function ExpensesPage() {
  const pocket = usePocket();
  const [weekOffset, setWeekOffset] = useState(0);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [managingCategories, setManagingCategories] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [replacementCategory, setReplacementCategory] = useState("");
  if (!pocket.ready) return <PageSkeleton />;
  const period = pocket.data.mode === "weekly"
    ? getPeriod("weekly", pocket.data.weekStartsOn, offsetDate(pocket.today, weekOffset * 7))
    : pocket.period;
  const periodExpenses = pocket.data.mode === "weekly" ? getPeriodExpenses(pocket.data.expenses, period) : pocket.expenses;
  const filtered = periodExpenses.filter((expense) => pocket.category === "전체" || expense.category === pocket.category);
  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) { setCategoryError("카테고리 이름을 입력해주세요."); return; }
    if (pocket.data.categories.includes(name)) { setCategoryError("이미 있는 카테고리입니다."); return; }
    if (name.length > 10) { setCategoryError("카테고리는 10자 이내로 입력해주세요."); return; }
    if (!pocket.addCategory(name)) { setCategoryError("카테고리는 최대 30개까지 추가할 수 있습니다."); return; }
    setCategoryName(""); setCategoryError(""); setAddingCategory(false); pocket.setCategory(name);
  }
  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title="지출 내역" subtitle={pocket.data.mode === "weekly" ? "주별로 기록을 확인할 수 있어요" : `${period.label} · ${period.scope}`} />
    {pocket.data.mode === "weekly" && <div className="flex items-center justify-between rounded-lg border border-black-010 px-3 py-2"><PillButton aria-label="이전 주" variant="ghost" size="icon" onClick={() => setWeekOffset((offset) => offset - 1)}><IconContainer size="slg"><ChevronLeft /></IconContainer></PillButton><span className="text-sm leading-150">{period.weekNumber}주차 · {period.label}</span><PillButton aria-label="다음 주" variant="ghost" size="icon" disabled={weekOffset >= 0} onClick={() => setWeekOffset((offset) => Math.min(0, offset + 1))}><IconContainer size="slg"><ChevronRight /></IconContainer></PillButton></div>}
    <div className="flex items-center justify-between gap-3"><span className="text-sm leading-150 text-black-030">{pocket.category === "전체" ? "전체 지출" : `${pocket.category} 지출`}</span><p className="font-numbers text-2xl leading-140">{formatMoney(sumExpenses(filtered))}원</p></div>
    <section className="flex flex-col gap-3" aria-label="카테고리"><div className="flex items-center justify-between gap-2"><h2 className="text-sm leading-150">카테고리</h2><PillButton type="button" variant="ghost" size="sm" aria-pressed={managingCategories} onClick={() => setManagingCategories((value) => !value)}>{managingCategories ? "완료" : "편집"}</PillButton></div><div className="flex flex-wrap gap-2" aria-label="카테고리 필터"><PillButton variant={pocket.category === "전체" ? "filled" : "outline"} size="sm" aria-pressed={pocket.category === "전체"} onClick={() => pocket.setCategory("전체")}>전체</PillButton>{pocket.data.categories.map((category) => <div key={category} className="flex items-center gap-1"><PillButton variant={pocket.category === category ? "filled" : "outline"} size="sm" aria-pressed={pocket.category === category} onClick={() => pocket.setCategory(category)}>{category}</PillButton>{managingCategories && <PillButton type="button" variant="ghost" size="icon" className="rounded-full px-2 py-2" aria-label={`${category} 삭제`} disabled={pocket.data.categories.length <= 1} onClick={() => { setCategoryToDelete(category); setReplacementCategory(pocket.data.categories.find((item) => item !== category) ?? ""); }}><IconContainer size="sm"><X /></IconContainer></PillButton>}</div>)}<PillButton type="button" variant="ghost" size="sm" disabled={pocket.data.categories.length >= 30} onClick={() => { setAddingCategory((value) => !value); setCategoryError(""); }}>＋ 추가</PillButton></div>
      {addingCategory && <form onSubmit={submitCategory} className="flex flex-col gap-2"><div className="flex gap-2"><TextField autoFocus aria-label="새 카테고리 이름" maxLength={10} placeholder="새 카테고리 이름" value={categoryName} onChange={(event) => { setCategoryName(event.target.value); setCategoryError(""); }} /><PillButton type="submit" size="sm">추가</PillButton></div>{categoryError && <p role="alert" className="text-xs leading-150 text-black-030">{categoryError}</p>}</form>}
    </section>
    <Dialog open={categoryToDelete !== null} onOpenChange={(open) => { if (!open) setCategoryToDelete(null); }}><DialogContent><DialogHeader><DialogTitle>카테고리 삭제</DialogTitle><DialogDescription>{categoryToDelete && (pocket.data.expenses.filter((expense) => expense.category === categoryToDelete).length ? `이 카테고리의 지출 ${pocket.data.expenses.filter((expense) => expense.category === categoryToDelete).length}건을 아래 카테고리로 옮긴 뒤 삭제합니다.` : "이 카테고리를 목록에서 삭제합니다.")}</DialogDescription></DialogHeader>{categoryToDelete && pocket.data.expenses.some((expense) => expense.category === categoryToDelete) && <div className="flex flex-col gap-2"><FieldLabel htmlFor="replacement-category" required>기록을 옮길 카테고리</FieldLabel><SelectField id="replacement-category" value={replacementCategory} options={pocket.data.categories.filter((item) => item !== categoryToDelete).map((item) => ({ value: item, label: item }))} onChange={(event) => setReplacementCategory(event.target.value)} /></div>}<DialogFooter><ActionButtonRow buttons={[{ label: "취소", variant: "outline", onClick: () => setCategoryToDelete(null) }, { label: "삭제", disabled: !categoryToDelete, onClick: () => { if (categoryToDelete && pocket.deleteCategory(categoryToDelete, replacementCategory)) { setCategoryToDelete(null); setManagingCategories(false); } } }]} /></DialogFooter></DialogContent></Dialog>
    <ExpenseList expenses={filtered} grouped />
  </div>;
}
