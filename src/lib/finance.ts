import { getPeriod, isDateKey, offsetDate, sumExpenses } from "./pocket.ts";
import type { PocketData, Period } from "./pocket.ts";

export type MoneyEntry = { id: string; date: string; amount: number; memo: string };
export type SavingsEntry = MoneyEntry & { direction: "deposit" | "withdraw" };
export type Installment = MoneyEntry & { months: number };
export type FixedExpense = MoneyEntry & { endMonth?: string; includeInBudget?: boolean; method?: "cash" | "card"; cadence?: "monthly" | "sessions"; sessionsPerPayment?: number; sessionDates?: string[]; paymentDates?: string[] };
export type Settlement = { count: number; date: string };
export type Payment = { gross: number; split: number; method: "cash" | "card"; settled: boolean; settledDate: string; note?: string; groceries?: boolean; settlements?: Settlement[] };
export type Finance = {
  months: Record<string, { budget: number; groceries: number }>;
  openingBalance: number; openingDate: string; billingDay: number; closingDay?: number; billingOffset?: number;
  incomes: MoneyEntry[]; plans: MoneyEntry[]; installments: Installment[];
  payments: Record<string, Payment>;
  fixedExpenses?: FixedExpense[];
  savings?: SavingsEntry[];
  noSpendDates?: string[];
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
    && (data.savings === undefined || Array.isArray(data.savings) && data.savings.length <= 10000 && data.savings.every((item) => entry(item) && ["deposit", "withdraw"].includes(item.direction)))
    && (data.noSpendDates === undefined || Array.isArray(data.noSpendDates) && data.noSpendDates.length <= 10000 && data.noSpendDates.every(isDateKey))
    && Array.isArray(data.installments) && data.installments.length <= 1000 && data.installments.every((item) => entry(item) && Number.isInteger(item.months) && item.months >= 2 && item.months <= 60)
    && (data.fixedExpenses === undefined || Array.isArray(data.fixedExpenses) && data.fixedExpenses.length <= 1000 && data.fixedExpenses.every((item) => entry(item) && (item.method === undefined || ["cash", "card"].includes(item.method)) && (item.cadence === undefined || ["monthly", "sessions"].includes(item.cadence)) && (item.cadence !== "sessions" || Number.isInteger(item.sessionsPerPayment) && item.sessionsPerPayment! >= 1 && item.sessionsPerPayment! <= 100 && Array.isArray(item.sessionDates) && item.sessionDates.length <= 10000 && item.sessionDates.every((date) => isDateKey(date) && date >= item.date) && Array.isArray(item.paymentDates) && item.paymentDates.length >= 1 && item.paymentDates.length <= 10000 && item.paymentDates.every((date) => isDateKey(date) && date >= item.date)) && (item.includeInBudget === undefined || typeof item.includeInBudget === "boolean") && (!item.endMonth || isDateKey(item.endMonth + "-01") && item.endMonth >= item.date.slice(0, 7))))
    && !!data.payments && typeof data.payments === "object" && Object.values(data.payments).every((item) => item && amount(item.gross) && Number.isInteger(item.split) && item.split >= 1 && item.split <= 100 && ["cash", "card"].includes(item.method) && (item.groceries === undefined || typeof item.groceries === "boolean") && (item.settlements === undefined || Array.isArray(item.settlements) && item.settlements.length <= 100 && item.settlements.every((receipt) => receipt && Number.isInteger(receipt.count) && receipt.count > 0 && isDateKey(receipt.date)) && item.settlements.reduce((sum,receipt) => sum + receipt.count, 0) <= item.split - 1) && typeof item.settled === "boolean" && isDateKey(item.settledDate) && (item.note === undefined || typeof item.note === "string" && item.note.length <= 200));
}
export function settlementRecords(payment: Payment): Settlement[] {
  return payment.settlements ?? (payment.settled && payment.split > 1 ? [{ count: payment.split - 1, date: payment.settledDate }] : []);
}
export function resizeSettlements(payment: Payment, count: number, date: string): Settlement[] {
  let remaining = count;
  const result: Settlement[] = [];
  for (const receipt of settlementRecords(payment)) {
    const take = Math.min(remaining, receipt.count);
    if (take > 0) result.push({ ...receipt, count: take });
    remaining -= take;
  }
  if (remaining > 0) result.push({ count: remaining, date });
  return result;
}
export function settlementSummary(payment: Payment, ownAmount = Math.ceil(payment.gross / payment.split)) {
  const people = payment.split - 1;
  const count = settlementRecords(payment).reduce((sum, receipt) => sum + receipt.count, 0);
  const total = Math.max(0, payment.gross - ownAmount);
  const receivedAmount = people > 0 ? Math.floor(total * count / people) : 0;
  return { people, count, total, receivedAmount, outstanding: total - receivedAmount };
}
export function unsettledExpenses(data: PocketData, category = "전체") {
  const payments = financeOf(data).payments;
  return data.expenses.filter((expense) => (category === "전체" || expense.category === category) && payments[expense.id] && settlementSummary(payments[expense.id], expense.amount).outstanding > 0).sort((a,b) => b.date.localeCompare(a.date));
}
export const financeOf = (data: PocketData): Finance => ({ ...emptyFinance(), ...data.finance });
export function monthDays(month: string) { return Number(getPeriod("monthly", 1, `${month}-01`).end.slice(8)); }
export function monthSettings(data: PocketData, month: string) {
  return financeOf(data).months[month] ?? { budget: 0, groceries: 0 };
}
export function fixedDueDate(item: FixedExpense, month: string) {
  if (item.cadence === "sessions") return (item.paymentDates ?? []).find((date) => date.slice(0, 7) === month) ?? null;
  if (month < item.date.slice(0, 7) || item.endMonth && month > item.endMonth) return null;
  return month + "-" + String(Math.min(Number(item.date.slice(8)), monthDays(month))).padStart(2, "0");
}
export function fixedTotal(data: PocketData, start: string, end: string, budgetOnly = false, method?: "cash" | "card") {
  const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));
  return (financeOf(data).fixedExpenses ?? []).filter((item) => (!budgetOnly || item.includeInBudget) && (!method || (item.method ?? "cash") === method)).reduce((sum, item) => {
    if (item.cadence === "sessions") return sum + (item.paymentDates ?? []).filter((date) => date >= start && date <= end).length * item.amount;
    const first = item.date.slice(0, 7) > start.slice(0, 7) ? item.date.slice(0, 7) : start.slice(0, 7);
    const last = item.endMonth && item.endMonth < end.slice(0, 7) ? item.endMonth : end.slice(0, 7);
    if (first > last) return sum;
    let count = monthIndex(last) - monthIndex(first) + 1;
    if (fixedDueDate(item, first)! < start) count--;
    if (fixedDueDate(item, last)! > end) count--;
    return sum + Math.max(0, count) * item.amount;
  }, 0);
}
export function allocatedBudget(data: PocketData, period: Period) {
  const total = monthSettings(data, period.start.slice(0, 7)).budget;
  const days = monthDays(period.start.slice(0, 7));
  if (period.mode === "monthly") return total;
  return Math.floor(total * Number(period.end.slice(8)) / days) - Math.floor(total * (Number(period.start.slice(8)) - 1) / days);
}
export function foodBudgetSummary(data: PocketData, period: Period) {
  const month = period.start.slice(0, 7);
  const rate = monthSettings(data, month).groceries;
  const finance = financeOf(data);
  const food = data.expenses.filter((expense) => expense.category === "식비" || finance.payments[expense.id]?.groceries);
  const allocation = (start: string, end: string) => Math.floor(rate * Number(end.slice(8)) / 7) - Math.floor(rate * (Number(start.slice(8)) - 1) / 7);
  const base = allocation(period.start, period.end);
  const previousSpent = sumExpenses(food.filter((expense) => expense.date >= month + "-01" && expense.date < period.start));
  const previousAllocation = Math.floor(rate * (Number(period.start.slice(8)) - 1) / 7);
  const carried = Math.max(0, previousSpent - previousAllocation);
  const carriedIn = Math.max(0, previousAllocation - previousSpent);
  const budget = Math.max(0, base + carriedIn - carried);
  const spent = sumExpenses(food.filter((expense) => expense.date >= period.start && expense.date <= period.end));
  const borrowed = Math.max(0, spent - budget);
  const nextDate = offsetDate(period.end, 1);
  const nextPeriod = nextDate.slice(0, 7) === month && period.mode === "weekly" ? getPeriod("weekly", data.weekStartsOn, nextDate) : null;
  const nextBase = nextPeriod ? allocation(nextPeriod.start, nextPeriod.end) : null;
  const nextAdjustment = previousAllocation + base - previousSpent - spent;
  const nextBudget = nextBase !== null ? Math.max(0, nextBase + nextAdjustment) : null;
  return { configured: rate > 0, base, carriedIn, nextBase, nextAdjustment, budget, spent, carried, borrowed, remaining: Math.max(0, budget - spent), nextBudget, nextPeriod };
}
export function financeSummary(data: PocketData, period: Period) {
  const month = period.start.slice(0, 7);
  const total = monthSettings(data, month).budget;
  const priorSpent = sumExpenses(data.expenses.filter((expense) => expense.date >= `${month}-01` && expense.date < period.start));
  const priorFixed = fixedTotal(data, month + "-01", period.start, true) - fixedTotal(data, period.start, period.start, true);
  const priorAllocation = Math.floor(total * (Number(period.start.slice(8)) - 1) / monthDays(month));
  let priorDebt = 0;
  for (const [previousMonth, setting] of Object.entries(financeOf(data).months).filter(([key]) => key < month).sort(([a],[b]) => a.localeCompare(b))) {
    const spentBefore = sumExpenses(data.expenses.filter((expense) => expense.date.slice(0,7) === previousMonth));
    priorDebt = Math.max(0, priorDebt + spentBefore + fixedTotal(data, previousMonth + "-01", getPeriod("monthly", 1, previousMonth + "-01").end, true) - setting.budget);
  }
  const carried = period.mode === "weekly" ? Math.max(0, priorDebt + priorSpent + priorFixed - priorAllocation) : priorDebt;
  const carriedIn = period.mode === "weekly" ? Math.max(0, priorAllocation - priorDebt - priorSpent - priorFixed) : 0;
  const budget = Math.max(0, allocatedBudget(data, period) + carriedIn - carried);
  const regularSpent = sumExpenses(data.expenses.filter((expense) => expense.date >= period.start && expense.date <= period.end));
  const fixedSpent = fixedTotal(data, period.start, period.end);
  const spent = regularSpent + fixedTotal(data, period.start, period.end, true);
  const remaining = budget - spent;
  const reserved = financeOf(data).plans.filter((plan) => plan.date >= period.start && plan.date <= period.end).reduce((sum, plan) => sum + plan.amount, 0);
  return { carriedIn, regularSpent, fixedSpent, budget, spent, remaining, carried, reserved, usedPercent: budget ? Math.round(spent / budget * 100) : spent ? 100 : 0, dailyAvailable: Math.max(0, Math.floor((remaining - reserved) / period.remainingDays)), dailyAverage: Math.floor(spent / period.elapsedDays) };
}
export function dailySpendingAllowance(data: PocketData, date: string) {
  const week = getPeriod("weekly", data.weekStartsOn, date);
  const { budget } = financeSummary(data, week);
  const spent = sumExpenses(data.expenses.filter((expense) => expense.date >= week.start && expense.date <= date));
  const fixed = fixedTotal(data, week.start, date, true);
  const reserved = financeOf(data).plans
    .filter((plan) => plan.date >= date && plan.date <= week.end)
    .reduce((sum, plan) => sum + plan.amount, 0);
  const remaining = budget - spent - fixed;
  const available = Math.max(0, Math.floor((remaining - reserved) / week.remainingDays));
  return { available, remaining, reserved, days: week.remainingDays };
}

export function nextMonth(month: string, offset = 1) { return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1)).toISOString().slice(0, 7); }
export function installmentDue(item: Installment, month: string) {
  const index = (Number(month.slice(0, 4)) - Number(item.date.slice(0, 4))) * 12 + Number(month.slice(5)) - Number(item.date.slice(5, 7));
  return index >= 0 && index < item.months ? Math.floor(item.amount * (index + 1) / item.months) - Math.floor(item.amount * index / item.months) : 0;
}
export function cardPaymentDate(finance: Finance, chargeDate: string) {
  const closingMonth = nextMonth(chargeDate.slice(0, 7), Number(chargeDate.slice(8)) > (finance.closingDay ?? 31) ? 1 : 0);
  const month = nextMonth(closingMonth, finance.billingOffset ?? 1);
  return month + "-" + String(Math.min(finance.billingDay, monthDays(month))).padStart(2, "0");
}
export function fixedCharges(item: FixedExpense, start: string, end: string) {
  if (item.cadence === "sessions") return (item.paymentDates ?? []).filter((date) => date >= start && date <= end);
  const dates: string[] = [];
  let month = item.date.slice(0, 7) > start.slice(0, 7) ? item.date.slice(0, 7) : start.slice(0, 7);
  const last = item.endMonth && item.endMonth < end.slice(0, 7) ? item.endMonth : end.slice(0, 7);
  while (month <= last) {
    const date = fixedDueDate(item, month);
    if (date && date >= start && date <= end) dates.push(date);
    month = nextMonth(month);
  }
  return dates;
}
export function cashFlow(data: PocketData, month: string) {
  const finance = financeOf(data);
  const end = getPeriod("monthly", 1, `${month}-01`).end;
  const inRange = (date: string) => date >= finance.openingDate && date <= end;
  let cashOut = 0, cardOut = 0, received = 0, receivable = 0, installments = 0, dueThisMonth = 0, futureCard = 0, installmentOutstanding = 0;
  let cardSettlements = 0;
  for (const expense of data.expenses) {
    const payment = finance.payments[expense.id];
    const gross = payment?.gross ?? expense.amount;
    const dueDate = cardPaymentDate(finance, expense.date);
    if (payment?.method === "card") { if (expense.date <= end && dueDate > end) futureCard += gross; if (inRange(dueDate)) cardOut += gross; if (dueDate.slice(0, 7) === month) dueThisMonth += gross; }
    else if (inRange(expense.date)) cashOut += gross;
    if (payment && expense.date <= end) {
      const total = Math.max(0, gross - expense.amount);
      const people = payment.split - 1;
      let count = 0, paidAsOfEnd = 0;
      for (const receipt of settlementRecords(payment)) {
        const portion = people > 0 ? Math.floor(total * (count + receipt.count) / people) - Math.floor(total * count / people) : 0;
        count += receipt.count;
        if (receipt.date <= end) paidAsOfEnd += portion;
        if (inRange(receipt.date)) received += portion;
      }
      receivable += total - paidAsOfEnd;
      if (payment.method === "card" && dueDate.slice(0, 7) === month) {
        cardSettlements += settlementSummary(payment, expense.amount).receivedAmount;
      }
    }
  }
  const cardBill = dueThisMonth - cardSettlements;
  let fixedCardOut = 0;
  for (const item of finance.fixedExpenses ?? []) {
    if (item.method !== "card") continue;
    for (const chargeDate of fixedCharges(item, nextMonth(finance.openingDate.slice(0, 7), -3) + "-01", end)) {
      const dueDate = cardPaymentDate(finance, chargeDate);
      if (inRange(dueDate)) { cardOut += item.amount; fixedCardOut += item.amount; }
      if (dueDate.slice(0, 7) === month) dueThisMonth += item.amount;
      if (dueDate > end) futureCard += item.amount;
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
  const fixedMonth = fixedTotal(data, month + "-01", end);
  const fixedCashOut = fixedTotal(data, finance.openingDate, end, false, "cash");
  const fixedOut = fixedCashOut + fixedCardOut;
  const livingRemaining = monthSettings(data, month).budget - monthSpent - planned - fixedTotal(data, month + "-01", end, true);
  const savings = finance.savings ?? [];
  const savedMonth = savings.filter((item) => item.date.slice(0,7) === month && item.direction === "deposit").reduce((sum,item) => sum + item.amount, 0);
  const withdrawnMonth = savings.filter((item) => item.date.slice(0,7) === month && item.direction === "withdraw").reduce((sum,item) => sum + item.amount, 0);
  const savingsBalance = savings.filter((item) => item.date <= end).reduce((sum,item) => sum + (item.direction === "deposit" ? item.amount : -item.amount), 0);
  const savingsTransfer = savings.filter((item) => inRange(item.date)).reduce((sum,item) => sum + (item.direction === "deposit" ? item.amount : -item.amount), 0);
  const balance = finance.openingBalance + income + received - cashOut - cardOut - installments - fixedCashOut - savingsTransfer;
  const availableBalance = balance - futureCard - installmentOutstanding - planned;
  return { savedMonth, withdrawnMonth, savingsBalance, savingsTransfer, fixedCashOut, fixedCardOut, fixedMonth, fixedOut, monthSpent, availableBalance, installmentOutstanding, futureCard, balance, income, cashOut, cardOut, received, receivable, installmentMonth, cardBill, cardSettlements, dueThisMonth, planned, recommendedLimit: Math.max(0, Math.min(livingRemaining, availableBalance)) };
}
