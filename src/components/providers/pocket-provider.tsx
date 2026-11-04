"use client";

import { createContext, useCallback, useContext, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { CATEGORIES, getPeriod, getPeriodExpenses, todayInSeoul } from "@/lib/pocket";
import { financeOf, financeSummary } from "@/lib/finance";
import type { Finance, MoneyEntry, Payment } from "@/lib/finance";
import type { BudgetMode, Category, Expense, FontPreferences } from "@/lib/pocket";
import { getServerSnapshot, getSnapshot, loadServerCopy, retryCloud, subscribe, updatePocket } from "@/lib/pocket-storage";

export type ExpenseDraft = { amount: string; category: Category; date: string; memo: string; payment?: Payment; splitInput?: string };
type EditorState = { planId?: string; open: boolean; expenseId: string | null; draft: ExpenseDraft };
type Notice = { message: string; action?: { label: string; onClick: () => void } } | null;
const emptyDraft = (today: string, category: string = CATEGORIES[0]): ExpenseDraft => ({ amount: "", category, date: today, memo: "", payment: { gross: 0, split: 1, method: "card", settled: false, settledDate: today } });

function usePocketController() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { data, today, ready, storage } = snapshot;
  const period = getPeriod(data.mode, data.weekStartsOn, today);
  const expenses = getPeriodExpenses(data.expenses, period);
  const summary = financeSummary(data, period);
  const [dailyView, setDailyView] = useState(false);
  const [category, setCategory] = useState<Category | "전체">("전체");
  const [notice, setNotice] = useState<Notice>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const [editor, setEditor] = useState<EditorState>({ open: false, expenseId: null, draft: emptyDraft("2000-01-01") });
  const returnFocus = useRef<HTMLElement | null>(null);

  function notify(message: string, persisted = true) {
    setNotice({ message: persisted ? message : `${message} 브라우저 저장을 사용할 수 없어 새로고침하면 사라질 수 있습니다.` });
  }
  function setMode(mode: BudgetMode | "daily") {
    setDailyView(mode === "daily");
    if (mode === "daily") return;
    updatePocket((current) => ({ ...current, mode }), { sync: false });
  }
  function saveFinance(finance: Finance) {
    const persisted = updatePocket((current) => ({ ...current, finance, isDemo: false, expenses: current.isDemo ? [] : current.expenses }));
    notify("저장했습니다.", persisted);
  }
  function saveMonthlyBudget(month: string, budget: number, groceries: number, weekStartsOn: number) {
    const persisted = updatePocket((current) => {
      const finance = financeOf(current);
      return { ...current, finance: { ...finance, months: { ...finance.months, [month]: { budget, groceries } } }, weekStartsOn, isDemo: false, expenses: current.isDemo ? [] : current.expenses };
    });
    notify(`${month} 예산을 저장했습니다.`, persisted);
  }
  function addCategory(value: string) {
    const name = value.trim();
    if (!name || name.length > 10 || data.categories.includes(name) || data.categories.length >= 30) return false;
    const persisted = updatePocket((current) => ({ ...current, categories: [...current.categories, name] }));
    notify("카테고리를 추가했습니다.", persisted);
    return true;
  }
  function deleteCategory(name: string, replacement: string) {
    if (data.categories.length <= 1 || !data.categories.includes(name)) return false;
    const usesCategory = data.expenses.some((expense) => expense.category === name);
    if (usesCategory && !data.categories.includes(replacement)) return false;
    const affectedCount = data.expenses.filter((expense) => expense.category === name).length;
    const persisted = updatePocket((current) => ({
      ...current,
      categories: current.categories.filter((category) => category !== name),
      expenses: current.expenses.map((expense) => expense.category === name ? { ...expense, category: replacement } : expense),
    }));
    if (category === name) setCategory("전체");
    notify(affectedCount ? `카테고리를 삭제하고 지출 ${affectedCount}건을 ‘${replacement}’으로 옮겼습니다.` : "카테고리를 삭제했습니다.", persisted);
    return true;
  }
  function saveBudget(amount: number, weekStartsOn: number) {
    const persisted = updatePocket((current) => ({ ...current, budgets: { ...current.budgets, [current.mode]: amount }, weekStartsOn, isDemo: false, expenses: current.isDemo ? [] : current.expenses }));
    notify(data.isDemo ? "예산을 저장하고 내 기록을 시작했습니다." : "예산을 저장했습니다.", persisted);
  }
  function openEditor(expense?: Expense, date = todayInSeoul()) {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditor((current) => {
      const expenseId = expense?.id ?? null;
      const reuse = expense === undefined && data.categories.includes(current.draft.category) && current.expenseId === expenseId && current.draft.date !== "2000-01-01" && (expense !== undefined || current.draft.date === date);
      const draft = reuse ? current.draft : expense
        ? { amount: String(financeOf(data).payments[expense.id]?.gross ?? expense.amount), payment: financeOf(data).payments[expense.id] ?? { gross: expense.amount, split: 1, method: "cash", settled: false, settledDate: expense.date }, category: expense.category, date: expense.date, memo: expense.memo }
        : emptyDraft(date, data.categories[0] ?? CATEGORIES[0]);
      return { open: true, expenseId, draft };
    });
  }
  function openPlanExpense(plan: MoneyEntry) {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditor({
      open: true,
      expenseId: null,
      planId: plan.id,
      draft: { ...emptyDraft(plan.date, data.categories[0] ?? CATEGORIES[0]), memo: plan.memo },
    });
  }
  function closeEditor() { setEditor((current) => ({ ...current, open: false })); }
  function restoreEditorFocus() {
    const origin = returnFocus.current;
    const fallback = document.getElementById("add-expense") || document.querySelector<HTMLElement>("[aria-current='page']");
    (origin?.isConnected ? origin : fallback)?.focus({ preventScroll: true });
  }
  function updateDraft(patch: Partial<ExpenseDraft>) {
    setEditor((current) => ({ ...current, draft: { ...current.draft, ...patch } }));
  }
  function saveExpense(amount: number) {
    const { expenseId, draft, planId } = editor;
    const expense: Expense = { id: expenseId ?? crypto.randomUUID(), amount: Math.ceil(amount / (draft.payment?.split ?? 1)), category: draft.category, date: draft.date, memo: draft.memo.trim() };
    const persisted = updatePocket((current) => {
      const finance = financeOf(current);
      if (planId) finance.plans = finance.plans.filter((plan) => plan.id !== planId);
      finance.payments = { ...finance.payments, [expense.id]: { gross: amount, split: 1, method: "card", settled: false, settledDate: today, ...draft.payment } };
      finance.payments[expense.id].gross = amount;
      if (expenseId) return { ...current, finance, expenses: current.expenses.map((item) => item.id === expenseId ? expense : item) };
      return { ...current, finance, isDemo: false, expenses: [expense, ...(current.isDemo ? [] : current.expenses)] };
    });
    setEditor({ open: false, expenseId: null, draft: emptyDraft(today, data.categories[0] ?? CATEGORIES[0]) });
    notify(expenseId ? "지출을 수정했습니다." : "지출을 기록했습니다.", persisted);
  }
  function deleteExpense() {
    const expense = data.expenses.find((item) => item.id === editor.expenseId);
    if (!expense) return;
    const persisted = updatePocket((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== expense.id) }));
    setEditor({ open: false, expenseId: null, draft: emptyDraft(today, data.categories[0] ?? CATEGORIES[0]) });
    if (!persisted) { notify("지출을 삭제했습니다.", false); return; }
    setNotice({ message: "지출을 삭제했습니다.", action: { label: "되돌리기", onClick: () => {
      const restored = updatePocket((current) => ({ ...current, expenses: current.expenses.some((item) => item.id === expense.id) ? current.expenses : [...current.expenses, expense] }));
      notify("지출을 복원했습니다.", restored);
    } } });
  }
  function startOwnRecords() {
    const persisted = updatePocket((current) => ({ ...current, isDemo: false, expenses: [] }));
    notify("내 기록을 시작합니다. 첫 지출을 추가해보세요.", persisted);
  }
  function saveFonts(fonts: FontPreferences) {
    const persisted = updatePocket((current) => ({ ...current, fonts: { ...fonts, chosen: true } }));
    notify("선택한 서체를 적용했습니다.", persisted);
  }

  return { data, today, ready, storage, retryCloud, loadServerCopy, period, expenses, summary, category, setCategory, dailyView, setMode,
    saveBudget, saveMonthlyBudget, saveFinance, addCategory, deleteCategory, notice, dismissNotice, editor, openEditor, openPlanExpense, closeEditor,
    updateDraft, saveExpense, deleteExpense, restoreEditorFocus, startOwnRecords, saveFonts };
}

type PocketContextValue = ReturnType<typeof usePocketController>;
const PocketContext = createContext<PocketContextValue | null>(null);

export function PocketProvider({ children }: { children: ReactNode }) {
  const value = usePocketController();
  return <PocketContext.Provider value={value}>{children}</PocketContext.Provider>;
}

export function usePocket() {
  const value = useContext(PocketContext);
  if (!value) throw new Error("PocketProvider가 필요합니다.");
  return value;
}
