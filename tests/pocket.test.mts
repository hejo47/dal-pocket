import assert from "node:assert/strict";
import test from "node:test";

import { createDemoData, getBudgetSummary, getCategoryTotals, getPeriod, getPeriodExpenses, isDateKey, isPocketData, normalizePocketData, offsetDate, sumExpenses, todayInSeoul } from "../src/lib/pocket.ts";
import type { Expense } from "../src/lib/pocket.ts";
import { isPocketWrite, isSameOriginWrite } from "../src/lib/pocket-api.ts";

test("주간은 선택한 요일부터 정확히 7일이고 월·연도 경계를 넘을 수 있다", () => {
  for (const [today, startDay, start, end] of [
    ["2026-11-02", 1, "2026-11-02", "2026-11-08"],
    ["2026-11-01", 1, "2026-10-26", "2026-11-01"],
    ["2027-01-01", 1, "2026-12-28", "2027-01-03"],
    ["2026-11-15", 0, "2026-11-15", "2026-11-21"],
  ] as const) {
    const period = getPeriod("weekly", startDay, today);
    assert.equal(period.start, start); assert.equal(period.end, end);
    assert.equal(period.totalDays, 7); assert.equal(period.elapsedDays + period.remainingDays, 8);
  }
});

test("월간 기간은 달의 실제 마지막 날짜와 윤년을 반영한다", () => {
  assert.equal(getPeriod("monthly", 1, "2028-02-29").end, "2028-02-29");
  assert.equal(getPeriod("monthly", 1, "2027-02-20").end, "2027-02-28");
  assert.equal(getPeriod("monthly", 1, "2026-11-02").totalDays, 30);
});

test("하루 사용 가능액은 오늘을 포함한 남은 일수로 나누고 초과 시 0원이다", () => {
  const expenses: Expense[] = [{ id: "1", amount: 15000, category: "식비", date: "2026-11-15", memo: "점심" }];
  const period = getPeriod("weekly", 0, "2026-11-15");
  assert.equal(getBudgetSummary(200000, expenses, period).dailyAvailable, 26428);
  assert.equal(getBudgetSummary(10000, expenses, period).remaining, -5000);
  assert.equal(getBudgetSummary(10000, expenses, period).dailyAvailable, 0);
});

test("기간 밖의 지출은 주간 예산 집계에서 제외된다", () => {
  const data = createDemoData("2026-11-15");
  assert.equal(sumExpenses(data.expenses), 214000);
  const sundayWeek = getPeriod("weekly", 0, "2026-11-15");
  assert.equal(sumExpenses(getPeriodExpenses(data.expenses, sundayWeek)), 15000);
  const mondayWeek = getPeriod("weekly", 1, "2026-11-15");
  assert.equal(sumExpenses(getPeriodExpenses(data.expenses, mondayWeek)), 214000);
});

test("같은 날짜에 새로 기록한 지출의 입력 순서를 유지한다", () => {
  const expenses: Expense[] = [
    { id: "a", amount: 1000, category: "교통", date: "2026-11-15", memo: "새 기록" },
    { id: "z", amount: 2000, category: "교통", date: "2026-11-15", memo: "이전 기록" },
  ];
  assert.deepEqual(getPeriodExpenses(expenses, getPeriod("monthly", 1, "2026-11-15")).map((item) => item.id), ["a", "z"]);
});

test("카테고리별 합계가 전체 합계와 일치하고 빈 기록의 분석은 비어 있다", () => {
  const data = createDemoData("2026-11-15");
  const groups = getCategoryTotals(data.expenses);
  assert.equal(groups[0].category, "쇼핑");
  assert.equal(groups.reduce((sum, group) => sum + group.amount, 0), 214000);
  assert.deepEqual(getCategoryTotals([]), []);
});

test("날짜 유효성 검사는 존재하지 않는 날짜를 거부한다", () => {
  assert.equal(isDateKey("2026-02-29"), false);
  assert.equal(isDateKey("2028-02-29"), true);
  assert.equal(isDateKey("2026-13-01"), false);
  assert.equal(offsetDate("2026-12-31", 1), "2027-01-01");
});

test("사용자 날짜는 실행 호스트 시간대 대신 서울 기준이다", () => {
  assert.equal(todayInSeoul(new Date("2026-11-01T14:59:59Z")), "2026-11-01");
  assert.equal(todayInSeoul(new Date("2026-11-01T15:00:00Z")), "2026-11-02");
});

test("저장 데이터는 잘못된 금액·요일·중복 ID·손상된 내역을 거부한다", () => {
  const data = createDemoData("2026-11-15");
  assert.equal(isPocketData(data), true);
  assert.equal(isPocketData({ ...data, budgets: { weekly: -1, monthly: 500000 } }), false);
  assert.equal(isPocketData({ ...data, weekStartsOn: 7 }), false);
  assert.equal(isPocketData({ ...data, expenses: [null] }), false);
  assert.equal(isPocketData({ ...data, expenses: [data.expenses[0], data.expenses[0]] }), false);
  assert.equal(isPocketData({ ...data, fonts: null }), false);
});

test("기존 기록과 예산을 보존하며 미선택·이전 서체 설정을 상승체로 옮긴다", () => {
  const data = createDemoData("2026-11-02");
  for (const fonts of [{ body: "pretendard", numbers: "pretendard", chosen: false }, { body: "spotlight", numbers: "spotlight", title: "spotlight", chosen: false }]) {
    const migrated = normalizePocketData({ ...data, fonts });
    assert.deepEqual(migrated?.expenses, data.expenses);
    assert.deepEqual(migrated?.budgets, data.budgets);
    assert.deepEqual(migrated?.fonts, { body: "chai", numbers: "chai", title: "chai", chosen: true });
  }
});

test("저장 API는 예시 데이터·잘못된 버전·미래 지출·과도한 식별자를 거부한다", () => {
  const data = { ...createDemoData("2026-11-02"), isDemo: false };
  assert.equal(isPocketWrite({ data, revision: 0 }, "2026-11-02"), true);
  assert.equal(isPocketWrite({ data: { ...data, isDemo: true }, revision: 0 }, "2026-11-02"), false);
  assert.equal(isPocketWrite({ data, revision: -1 }, "2026-11-02"), false);
  assert.equal(isPocketWrite({ data, revision: 1.5 }, "2026-11-02"), false);
  assert.equal(isPocketWrite({ data: { ...data, expenses: [{ ...data.expenses[0], date: "2026-11-03" }] }, revision: 0 }, "2026-11-02"), false);
  assert.equal(isPocketWrite({ data: { ...data, expenses: [{ ...data.expenses[0], id: "a".repeat(101) }] }, revision: 0 }, "2026-11-02"), false);
});

test("저장 API는 같은 출처의 JSON 요청만 허용한다", () => {
  const url = "https://dal-pocket.example/api/pocket";
  assert.equal(isSameOriginWrite(new Request(url, { headers: { origin: "https://dal-pocket.example", "content-type": "application/json; charset=utf-8" } })), true);
  assert.equal(isSameOriginWrite(new Request(url, { headers: { origin: "https://other.example", "content-type": "application/json" } })), false);
  assert.equal(isSameOriginWrite(new Request(url, { headers: { origin: "https://dal-pocket.example", "content-type": "text/plain" } })), false);
  assert.equal(isSameOriginWrite(new Request(url)), false);
});
