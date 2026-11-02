import { getPeriod, isDateKey, sumExpenses } from "./pocket.ts";
import type { PocketData, Period } from "./pocket.ts";

export type MoneyEntry = { id: string; date: string; amount: number; memo: string };
export type Installment = MoneyEntry & { months: number };
export type Payment = { gross: number; split: number; method: "cash" | "card"; settled: boolean; settledDate: string; note?: string; groceries?: boolean };
export type Finance = {
  months: Record<string, { budget: number; groceries: number }>;
  openingBalance: number; openingDate: string; billingDay: number; closingDay?: number; billingOffset?: number;
  incomes: MoneyEntry[]; plans: MoneyEntry[]; installments: Installment[];
  payments: Record<string, Payment>;
};
export const emptyFinance = (): Finance => ({ months: {}, openingBalance: 0, openingDate: "2000-01-01", billingDay: 15, incomes: [], plans: [], installments: [], payments: {} });
export function isFinance(value: unknown): value is Finance {
  if (!value || typeof value !== "object") return false;
  const data = value as Finance;
  const amount = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 1_000_000_000;
  const entry = (value: MoneyEntry) => value && typeof value.id === "string" && value.id.length <= 100 && isDateKey(value.date) && amount(value.amount) && typeof value.memo === "string" && value.memo.length <= 80;
  return (data.closingDay === undefined || Number.isInteger(data.closingDay) && data.closingDay >= 1 && data.closingDay <= 31) && (data.billingOffset === undefined || Number.isInteger(data.billingOffset) && data.billingOffset >= 0 && data.billingOffset <= 2) && Number.isSafeInteger(data.openingBalance) && Math.abs(data.openingBalance) <= 1_000_000_000 && isDateKey(data.openingDate) && Number.isInteger(data.billingDay) && data.billingDay >= 1 && data.billingDay <= 31
    && !!data.months && typeof data.months === "object" && Object.entries(data.months).every(([month, setting]) => /^\d{4}-\d{2}$/.test(month) && isDateKey(`${month}-01`) && setting && amount(setting.budget) && amount(setting.groceries))
    && Array.isArray(data.incomes) && data.incomes.length <= 10000 && data.incomes.every(entry)
    && Array.isArray(data.plans) && data.plans.length <= 10000 && data.plans.every(entry)
    && Array.isArray(data.installments) && data.installments.length <= 1000 && data.installments.every((item) => entry(item) && Number.isInteger(item.months) && item.months >= 2 && item.months <= 60)
    && !!data.payments && typeof data.payments === "object" && Object.values(data.payments).every((item) => item && amount(item.gross) && Number.isInteger(item.split) && item.split >= 1 && item.split <= 100 && ["cash", "card"].includes(item.method) && (item.groceries === undefined || typeof item.groceries === "boolean") && typeof item.settled === "boolean" && isDateKey(item.settledDate) && (item.note === undefined || typeof item.note === "string" && item.note.length <= 200));
}
export const financeOf = (data: PocketData): Finance => ({ ...emptyFinance(), ...data.finance });
export function monthDays(month: string) { return Number(getPeriod("monthly", 1, `${month}-01`).end.slice(8)); }
export function monthSettings(data: PocketData, month: string) {
  return financeOf(data).months[month] ?? { budget: 0, groceries: 0 };
}
export function allocatedBudget(data: PocketData, period: Period) {
  const total = monthSettings(data, period.start.slice(0, 7)).budget;
  const days = monthDays(period.start.slice(0, 7));
  if (period.mode === "monthly") return total;
  return Math.floor(total * Number(period.end.slice(8)) / days) - Math.floor(total * (Number(period.start.slice(8)) - 1) / days);
}
export function financeSummary(data: PocketData, period: Period) {
  const month = period.start.slice(0, 7);
  const total = monthSettings(data, month).budget;
  const priorSpent = sumExpenses(data.expenses.filter((expense) => expense.date >= `${month}-01` && expense.date < period.start));
  const priorAllocation = Math.floor(total * (Number(period.start.slice(8)) - 1) / monthDays(month));
  let priorDebt = 0;
  for (const [previousMonth, setting] of Object.entries(financeOf(data).months).filter(([key]) => key < month).sort(([a],[b]) => a.localeCompare(b))) {
    const spentBefore = sumExpenses(data.expenses.filter((expense) => expense.date.slice(0,7) === previousMonth));
    priorDebt = Math.max(0, priorDebt + spentBefore - setting.budget);
  }
  const carried = period.mode === "weekly" ? Math.max(0, priorDebt + priorSpent - priorAllocation) : priorDebt;
  const budget = Math.max(0, allocatedBudget(data, period) - carried);
  const spent = sumExpenses(data.expenses.filter((expense) => expense.date >= period.start && expense.date <= period.end));
  const remaining = budget - spent;
  const reserved = financeOf(data).plans.filter((plan) => plan.date >= period.start && plan.date <= period.end).reduce((sum, plan) => sum + plan.amount, 0);
  return { budget, spent, remaining, carried, reserved, usedPercent: budget ? Math.round(spent / budget * 100) : spent ? 100 : 0, dailyAvailable: Math.max(0, Math.floor((remaining - reserved) / period.remainingDays)), dailyAverage: Math.floor(spent / period.elapsedDays) };
}
export function nextMonth(month: string, offset = 1) { return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1)).toISOString().slice(0, 7); }
export function installmentDue(item: Installment, month: string) {
  const index = (Number(month.slice(0, 4)) - Number(item.date.slice(0, 4))) * 12 + Number(month.slice(5)) - Number(item.date.slice(5, 7));
  return index >= 0 && index < item.months ? Math.floor(item.amount * (index + 1) / item.months) - Math.floor(item.amount * index / item.months) : 0;
}
export function cashFlow(data: PocketData, month: string) {
  const finance = financeOf(data);
  const end = getPeriod("monthly", 1, `${month}-01`).end;
  const inRange = (date: string) => date >= finance.openingDate && date <= end;
  let cashOut = 0, cardOut = 0, received = 0, receivable = 0, installments = 0, dueThisMonth = 0, futureCard = 0, installmentOutstanding = 0;
  for (const expense of data.expenses) {
    const payment = finance.payments[expense.id];
    const gross = payment?.gross ?? expense.amount;
    const closingMonth = nextMonth(expense.date.slice(0, 7), Number(expense.date.slice(8)) > (finance.closingDay ?? 31) ? 1 : 0);
    const billingMonth = nextMonth(closingMonth, finance.billingOffset ?? 1);
    const dueDate = `${billingMonth}-${String(Math.min(finance.billingDay, monthDays(billingMonth))).padStart(2, "0")}`;
    if (payment?.method === "card") { if (expense.date <= end && dueDate > end) futureCard += gross; if (inRange(dueDate)) cardOut += gross; if (dueDate.slice(0, 7) === month) dueThisMonth += gross; }
    else if (inRange(expense.date)) cashOut += gross;
    if (payment && expense.date <= end) {
      if (payment.settled && inRange(payment.settledDate || expense.date)) received += gross - expense.amount;
      else if (!payment.settled) receivable += gross - expense.amount;
    }
  }
  for (const item of finance.installments) {
    for (let index = 0; index < item.months; index++) {
      const dueMonth = nextMonth(item.date.slice(0, 7), index);
      const date = `${dueMonth}-${String(Math.min(finance.billingDay, monthDays(dueMonth))).padStart(2, "0")}`;
      if (inRange(date)) installments += installmentDue(item, dueMonth);
      if (date > end) installmentOutstanding += installmentDue(item, dueMonth);
    }
  }
  const income = finance.incomes.filter((entry) => inRange(entry.date)).reduce((sum, entry) => sum + entry.amount, 0);
  const installmentMonth = finance.installments.reduce((sum, item) => sum + installmentDue(item, month), 0);
  const planned = finance.plans.filter((entry) => entry.date.slice(0, 7) === month).reduce((sum, entry) => sum + entry.amount, 0);
  const monthSpent = sumExpenses(data.expenses.filter((expense) => expense.date.slice(0,7) === month));
  const livingRemaining = monthSettings(data, month).budget - monthSpent - planned;
  const balance = finance.openingBalance + income + received - cashOut - cardOut - installments;
  const availableBalance = balance - futureCard - installmentOutstanding - planned;
  return { availableBalance, installmentOutstanding, futureCard, balance, income, cashOut, cardOut, received, receivable, installmentMonth, dueThisMonth, planned, recommendedLimit: Math.max(0, Math.min(livingRemaining, availableBalance)) };
}
