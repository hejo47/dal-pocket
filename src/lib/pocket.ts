export const CATEGORIES = ["식비", "카페", "교통", "쇼핑", "여가", "기타"] as const;
export const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"] as const;
export const FONT_NAMES = { spotlight: "Y 너만을 비춤체", chai: "차이 상승체" } as const;

export type Category = string;
export type BudgetMode = "weekly" | "monthly";
export type FontChoice = keyof typeof FONT_NAMES;
export type Expense = { id: string; amount: number; category: Category; date: string; memo: string };
export type FontPreferences = { body: FontChoice; numbers: FontChoice; title: FontChoice; chosen: boolean };
export const DEFAULT_FONTS: FontPreferences = { body: "chai", numbers: "chai", title: "chai", chosen: true };
export type PocketData = {
  version: 1;
  mode: BudgetMode;
  budgets: Record<BudgetMode, number>;
  weekStartsOn: number;
  expenses: Expense[];
  categories: Category[];
  fonts: FontPreferences;
  isDemo: boolean;
};

const DAY = 86_400_000;
const numberFormat = new Intl.NumberFormat("ko-KR");
export const formatMoney = (value: number) => numberFormat.format(value);
export const parseAmount = (value: string) => Number(value.replace(/\D/g, ""));
export const validAmount = (value: number) => Number.isSafeInteger(value) && value > 0 && value <= 100_000_000;

export function todayInSeoul(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function offsetDate(value: string, days: number) {
  return new Date(new Date(`${value}T00:00:00Z`).getTime() + days * DAY).toISOString().slice(0, 10);
}

export function shortDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}. ${Number(day)}.`;
}

export function getPeriod(mode: BudgetMode, weekStartsOn: number, today: string) {
  const date = new Date(`${today}T00:00:00Z`);
  if (!isDateKey(today) || weekStartsOn < 0 || weekStartsOn > 6 || !Number.isInteger(weekStartsOn)) {
    throw new Error("올바른 날짜와 주 시작 요일이 필요합니다.");
  }
  let start: string;
  let end: string;
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const firstWeekOffset = (new Date(`${monthStart}T00:00:00Z`).getUTCDay() - weekStartsOn + 7) % 7;
  if (mode === "weekly") {
    const elapsed = (date.getUTCDay() - weekStartsOn + 7) % 7;
    start = offsetDate(today, -elapsed);
    end = offsetDate(start, 6);
    start = start < monthStart ? monthStart : start;
    end = end > monthEnd ? monthEnd : end;
  } else {
    start = monthStart;
    end = monthEnd;
  }
  const startTime = new Date(`${start}T00:00:00Z`).getTime();
  const endTime = new Date(`${end}T00:00:00Z`).getTime();
  return {
    start, end, mode,
    weekNumber: mode === "weekly" ? Math.floor((date.getUTCDate() - 1 + firstWeekOffset) / 7) + 1 : null,
    label: `${shortDate(start)}–${shortDate(end)}`,
    elapsedDays: Math.round((date.getTime() - startTime) / DAY) + 1,
    remainingDays: Math.round((endTime - date.getTime()) / DAY) + 1,
    totalDays: Math.round((endTime - startTime) / DAY) + 1,
    scope: mode === "weekly" ? "이번 주" : "이번 달",
  };
}

export type Period = ReturnType<typeof getPeriod>;

export function getPeriodBudget(budget: number, period: Period) {
  return period.mode === "weekly" ? Math.floor(budget * period.totalDays / 7) : budget;
}

export function getCalendarMonth(month: string, weekStartsOn: number, expenses: Expense[]) {
  if (!/^\d{4}-\d{2}$/.test(month) || !isDateKey(`${month}-01`)) throw new Error("올바른 월이 필요합니다.");
  const period = getPeriod("monthly", weekStartsOn, `${month}-01`);
  const leadingDays = (new Date(`${period.start}T00:00:00Z`).getUTCDay() - weekStartsOn + 7) % 7;
  const firstCell = offsetDate(period.start, -leadingDays);
  const dayTotals = new Map<string, { amount: number; count: number }>();
  for (const expense of getPeriodExpenses(expenses, period)) {
    const current = dayTotals.get(expense.date) ?? { amount: 0, count: 0 };
    dayTotals.set(expense.date, { amount: current.amount + expense.amount, count: current.count + 1 });
  }
  const weeks = Array.from({ length: Math.ceil((leadingDays + period.totalDays) / 7) }, (_, week) => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = offsetDate(firstCell, week * 7 + index);
      return { date, inMonth: date >= period.start && date <= period.end, ...dayTotals.get(date) ?? { amount: 0, count: 0 } };
    });
    const weekPeriod = getPeriod("weekly", weekStartsOn, days.find((day) => day.inMonth)!.date);
    return { number: week + 1, days, period: weekPeriod, spent: days.reduce((sum, day) => sum + day.amount, 0) };
  });
  return { period, weeks, total: sumExpenses(getPeriodExpenses(expenses, period)), recordedDays: dayTotals.size };
}

export function getPeriodExpenses(expenses: Expense[], period: Pick<Period, "start" | "end">) {
  return expenses.filter((expense) => expense.date >= period.start && expense.date <= period.end)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function sumExpenses(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function getBudgetSummary(configuredBudget: number, expenses: Expense[], period: Period) {
  const budget = getPeriodBudget(configuredBudget, period);
  const spent = sumExpenses(getPeriodExpenses(expenses, period));
  const remaining = budget - spent;
  return {
    budget, spent, remaining,
    usedPercent: budget ? Math.round((spent / budget) * 100) : spent ? 100 : 0,
    dailyAvailable: Math.max(0, Math.floor(remaining / period.remainingDays)),
    dailyAverage: Math.floor(spent / period.elapsedDays),
  };
}

export function getCategoryTotals(expenses: Expense[]) {
  const total = sumExpenses(expenses);
  return [...new Set([...CATEGORIES, ...expenses.map((expense) => expense.category)])].map((category) => {
    const amount = sumExpenses(expenses.filter((expense) => expense.category === category));
    return { category, amount, percent: total ? Math.round(amount / total * 100) : 0 };
  }).filter((group) => group.amount > 0).sort((a, b) => b.amount - a.amount);
}

export function createDemoData(today: string): PocketData {
  const samples: Omit<Expense, "id" | "date">[] = [
    { amount: 9000, category: "식비", memo: "점심 한 끼" },
    { amount: 4500, category: "카페", memo: "아메리카노" },
    { amount: 1500, category: "교통", memo: "버스" },
    { amount: 13000, category: "식비", memo: "친구와 저녁" },
    { amount: 59000, category: "쇼핑", memo: "겨울 니트" },
    { amount: 3000, category: "교통", memo: "버스 왕복" },
    { amount: 24000, category: "여가", memo: "전시 관람" },
    { amount: 18000, category: "식비", memo: "점심과 저녁" },
    { amount: 7000, category: "카페", memo: "커피와 디저트" },
    { amount: 45000, category: "쇼핑", memo: "운동용품" },
    { amount: 17000, category: "식비", memo: "식사" },
    { amount: 6000, category: "교통", memo: "대중교통" },
    { amount: 7000, category: "카페", memo: "동네 카페" },
  ];
  return {
    version: 1, mode: "weekly", budgets: { weekly: 250000, monthly: 500000 },
    weekStartsOn: 1, fonts: { ...DEFAULT_FONTS }, categories: [], isDemo: true,
    expenses: samples.map((sample, index) => ({ ...sample, id: `demo-${index}`, date: offsetDate(today, -Math.floor(index / 3)) })),
  };
}

export function isPocketData(value: unknown): value is PocketData {
  if (!value || typeof value !== "object") return false;
  const data = value as PocketData;
  return data.version === 1 && ["weekly", "monthly"].includes(data.mode)
    && validAmount(data.budgets?.weekly) && validAmount(data.budgets?.monthly)
    && Number.isInteger(data.weekStartsOn) && data.weekStartsOn >= 0 && data.weekStartsOn <= 6
    && typeof data.isDemo === "boolean" && typeof data.fonts?.chosen === "boolean"
    && ["spotlight", "chai"].includes(data.fonts.body) && ["spotlight", "chai"].includes(data.fonts.numbers) && ["spotlight", "chai"].includes(data.fonts.title)
    && Array.isArray(data.categories) && data.categories.length <= 30 && data.categories.every((category) => typeof category === "string" && category.trim().length > 0 && category.length <= 10)
    && new Set(data.categories).size === data.categories.length
    && Array.isArray(data.expenses) && data.expenses.every((expense) =>
      expense !== null && typeof expense === "object" && typeof expense.id === "string" && validAmount(expense.amount)
      && typeof expense.category === "string" && expense.category.trim().length > 0 && expense.category.length <= 10 && isDateKey(expense.date)
      && typeof expense.memo === "string" && expense.memo.length <= 80)
    && new Set(data.expenses.map((expense) => expense.id)).size === data.expenses.length;
}

export function normalizePocketData(value: unknown): PocketData | null {
  if (isPocketData(value)) return value.fonts.chosen ? value : { ...value, fonts: { ...DEFAULT_FONTS } };
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!raw.fonts || typeof raw.fonts !== "object") return null;
  const fonts = raw.fonts as Record<string, unknown>;
  if (!["pretendard", "spotlight", "chai"].includes(String(fonts.body)) || !["pretendard", "spotlight", "chai"].includes(String(fonts.numbers))) return null;
  const migrated = { ...raw, categories: Array.isArray(raw.categories) ? raw.categories : [], fonts: { ...DEFAULT_FONTS } };
  return isPocketData(migrated) ? migrated : null;
}
