import assert from "node:assert/strict";
import test from "node:test";
import { createDemoData, getCalendarMonth, getPeriod, offsetDate } from "../src/lib/pocket.ts";
import { allocatedBudget, cashFlow, dailySpendingAllowance, settlementSummary, unsettledExpenses, resizeSettlements, fixedDueDate, fixedTotal, foodBudgetSummary, emptyFinance, financeSummary, installmentDue, isFinance, monthSettings, planSummary, linkPlanExpenses } from "../src/lib/finance.ts";
function data() { const value = createDemoData("2026-11-02"); value.expenses=[]; value.isDemo=false; value.finance={...emptyFinance(),months:{"2026-11":{budget:300000,groceries:30000}}}; return value; }
test("월별 하나의 예산을 모든 짧은 주에 배분해도 합계가 동일하다",()=>{const value=data();const month=getCalendarMonth("2026-11",1,[]);assert.equal(month.weeks.reduce((sum,week)=>sum+allocatedBudget(value,week.period),0),300000);assert.equal(allocatedBudget(value,getPeriod("weekly",1,"2026-11-01")),10000);assert.equal(monthSettings(value,"2026-10").budget,0);});
test("주 경계 이동이 월초 하루짜리 주를 건너뛰지 않는다",()=>{const october=getPeriod("weekly",1,"2026-10-31");const first=getPeriod("weekly",1,offsetDate(october.end,1));assert.equal(first.start,"2026-11-01");assert.equal(first.end,"2026-11-01");assert.equal(getPeriod("weekly",1,offsetDate(first.end,1)).start,"2026-11-02");});
test("초과 지출만 다음 주에서 차감하며 월 전체 예산은 중복 차감하지 않는다",()=>{const value=data();value.expenses=[{id:"expense",date:"2026-11-01",amount:20000,category:"식비",memo:""}];const summary=financeSummary(value,getPeriod("weekly",1,"2026-11-02"));assert.equal(summary.carried,10000);assert.equal(summary.budget,60000);assert.equal(financeSummary(value,getPeriod("monthly",1,"2026-11-02")).remaining,280000);});
test("할부 원금은 개월별 원 단위 반올림 오차 없이 배분된다",()=>{const item={id:"i",date:"2026-11-01",amount:100001,memo:"",months:3};assert.equal(["2026-11","2026-12","2027-01"].reduce((sum,month)=>sum+installmentDue(item,month),0),100001);assert.equal(installmentDue(item,"2027-02"),0);});
test("카드 원래 결제액은 다음 달 출금, 받은 정산은 수입, 할부는 현금만 차감한다",()=>{const value=data();const finance=value.finance!;finance.openingBalance=100000;finance.openingDate="2026-10-01";finance.incomes=[{id:"income",date:"2026-11-01",amount:50000,memo:""}];finance.installments=[{id:"i",date:"2026-11-01",amount:30000,months:3,memo:""}];value.expenses=[{id:"e",date:"2026-10-10",amount:20000,category:"식비",memo:""}];finance.payments.e={gross:60000,split:3,method:"card",settled:true,settledDate:"2026-11-05"};const flow=cashFlow(value,"2026-11");assert.equal(flow.cardOut,60000);assert.equal(flow.received,40000);assert.equal(flow.balance,120000);assert.equal(flow.installmentMonth,10000);assert.equal(financeSummary(value,getPeriod("monthly",1,"2026-11-02")).spent,0);assert.ok(isFinance(finance));});
test("약속 예상액은 실제 소비와 구분해 하루 사용 가능액에서 확보한다",()=>{const value=data();value.finance!.plans=[{id:"p",date:"2026-11-04",amount:20000,memo:"약속"}];const summary=financeSummary(value,getPeriod("weekly",1,"2026-11-02"));assert.equal(summary.spent,0);assert.equal(summary.reserved,20000);assert.equal(summary.dailyAvailable,Math.floor(60000/7));});

test("사용자 카드 마감일 다음날 사용액은 다음 이용 기간으로 넘어간다",()=>{const value=data();value.finance!.openingBalance=100000;value.finance!.openingDate="2026-11-01";value.finance!.closingDay=14;value.finance!.billingDay=28;value.finance!.billingOffset=0;value.expenses=[{id:"before",date:"2026-11-14",amount:10000,category:"식비",memo:""},{id:"after",date:"2026-11-15",amount:20000,category:"식비",memo:""}];for(const expense of value.expenses)value.finance!.payments[expense.id]={gross:expense.amount,split:1,method:"card",settled:false,settledDate:expense.date};const flow=cashFlow(value,"2026-11");assert.equal(flow.cardOut,10000);assert.equal(flow.futureCard,20000);assert.equal(flow.balance,90000);});

test("고정 지출은 매월 반복하고 짧은 달은 말일에 적용한다",()=>{const item={id:"fixed",date:"2026-01-31",amount:50000,memo:"통신비",endMonth:"2026-03"};assert.equal(fixedDueDate(item,"2026-02"),"2026-02-28");assert.equal(fixedDueDate(item,"2026-04"),null);const value=data();value.finance!.fixedExpenses=[item];assert.equal(fixedTotal(value,"2026-01-01","2026-03-31"),150000);assert.equal(fixedTotal(value,"2026-02-01","2026-02-27"),0);});
test("고정 지출은 별도 합계와 현금에만 반영하고 생활 예산에서 제외한다",()=>{const value=data();value.finance!.openingDate="2026-11-01";value.finance!.openingBalance=100000;value.finance!.fixedExpenses=[{id:"fixed",date:"2026-11-05",amount:30000,memo:"월세",includeInBudget:false}];const summary=financeSummary(value,getPeriod("monthly",1,"2026-11-02"));assert.equal(summary.regularSpent,0);assert.equal(summary.fixedSpent,30000);assert.equal(summary.spent,0);assert.equal(summary.remaining,300000);assert.equal(cashFlow(value,"2026-11").balance,70000);assert.ok(isFinance(value.finance));});

test("초과 식비를 다음 주 식비에서 차감하고 월 마지막 주는 다음 주를 숨긴다",()=>{const value=data();value.finance!.months["2026-11"].groceries=70000;value.expenses=[{id:"f0",date:"2026-11-01",amount:10000,category:"식비",memo:""},{id:"f1",date:"2026-11-03",amount:90000,category:"식비",memo:""}];const current=foodBudgetSummary(value,getPeriod("weekly",1,"2026-11-03"));assert.equal(current.borrowed,20000);assert.equal(current.nextBudget,50000);assert.equal(foodBudgetSummary(value,getPeriod("weekly",1,"2026-11-09")).budget,50000);assert.equal(foodBudgetSummary(value,getPeriod("weekly",1,"2026-11-30")).nextPeriod,null);});

test("주별 미사용액은 전체 예산과 식비에 가산하되 월 총액은 늘리지 않는다",()=>{const value=data();value.finance!.months["2026-11"].groceries=70000;const period=getPeriod("weekly",1,"2026-11-02");const summary=financeSummary(value,period);assert.equal(summary.carriedIn,10000);assert.equal(summary.budget,80000);const food=foodBudgetSummary(value,period);assert.equal(food.carriedIn,10000);assert.equal(food.nextBase,70000);assert.equal(food.nextBudget,150000);assert.equal(financeSummary(value,getPeriod("monthly",1,"2026-11-02")).budget,300000);assert.equal(foodBudgetSummary(value,getPeriod("weekly",1,"2026-11-30")).nextPeriod,null);});

test("카드 고정비는 이용 월의 고정 합계와 다음 결제일 출금으로 구분한다",()=>{const value=data();value.finance!.openingDate="2026-11-01";value.finance!.openingBalance=100000;value.finance!.fixedExpenses=[{id:"card-fixed",date:"2026-11-05",endMonth:"2026-11",amount:30000,memo:"구독",method:"card"}];const november=cashFlow(value,"2026-11");assert.equal(november.fixedMonth,30000);assert.equal(november.balance,100000);assert.equal(november.futureCard,30000);const december=cashFlow(value,"2026-12");assert.equal(december.fixedMonth,0);assert.equal(december.cardOut,30000);assert.equal(december.fixedCardOut,30000);assert.equal(december.balance,70000);});
test("4회 선불 학원비는 결제 기록만 합산하고 다음 달에 자동 결제하지 않는다",()=>{const value=data();value.finance!.openingDate="2026-11-01";value.finance!.openingBalance=200000;value.finance!.fixedExpenses=[{id:"class",date:"2026-11-01",amount:40000,memo:"학원",method:"cash",cadence:"sessions",sessionsPerPayment:4,paymentDates:["2026-11-01"],sessionDates:["2026-11-02","2026-11-09","2026-11-16","2026-11-23"]}];assert.ok(isFinance(value.finance));assert.equal(fixedTotal(value,"2026-11-01","2026-11-30"),40000);assert.equal(cashFlow(value,"2026-12").balance,160000);assert.equal(cashFlow(value,"2026-12").fixedMonth,0);value.finance!.fixedExpenses![0].paymentDates!.push("2026-12-01");assert.equal(cashFlow(value,"2026-12").fixedMonth,40000);assert.equal(cashFlow(value,"2026-12").balance,120000);});

test("저축과 인출은 소비 합계에서 제외하고 사용 가능 현금과 저축 잔액에 반영한다",()=>{const value=data();value.finance!.openingDate="2026-11-01";value.finance!.openingBalance=100000;value.finance!.savings=[{id:"old",date:"2026-10-01",amount:20000,memo:"이전 저축",direction:"deposit"},{id:"save",date:"2026-11-05",amount:30000,memo:"적금",direction:"deposit"},{id:"take",date:"2026-11-10",amount:5000,memo:"인출",direction:"withdraw"}];assert.ok(isFinance(value.finance));const flow=cashFlow(value,"2026-11");assert.equal(flow.balance,75000);assert.equal(flow.savedMonth,30000);assert.equal(flow.withdrawnMonth,5000);assert.equal(flow.savingsBalance,45000);assert.equal(financeSummary(value,getPeriod("monthly",1,"2026-11-02")).spent,0);});

test("부분 정산은 받은 인원별 금액과 날짜를 반영하고 카테고리별 미정산만 찾는다",()=>{const value=data();value.finance!.openingDate="2026-11-01";value.finance!.openingBalance=100000;value.expenses=[{id:"date",date:"2026-11-01",amount:30000,category:"데이트",memo:""},{id:"food",date:"2026-11-01",amount:10000,category:"식비",memo:""}];value.finance!.payments.date={gross:90000,split:3,method:"cash",settled:false,settledDate:"2026-11-03",settlements:[{count:1,date:"2026-11-03"},{count:1,date:"2026-12-01"}]};value.finance!.payments.food={gross:20000,split:2,method:"cash",settled:false,settledDate:"2026-11-01"};const november=cashFlow(value,"2026-11");assert.equal(november.received,30000);assert.equal(november.receivable,40000);assert.equal(november.balance,20000);assert.equal(cashFlow(value,"2026-12").received,60000);assert.equal(unsettledExpenses(value,"데이트").length,0);value.finance!.payments.date.settlements!.pop();assert.equal(unsettledExpenses(value,"데이트").length,1);assert.equal(settlementSummary(value.finance!.payments.date).outstanding,30000);assert.ok(isFinance(value.finance));});
test("정산 반올림 잔여액을 보존하고 받은 인원이 상대 인원을 넘으면 저장 거부한다",()=>{const value=data();const payment={gross:101,split:3,method:"cash" as const,settled:false,settledDate:"2026-11-01",settlements:[{count:1,date:"2026-11-01"}]};assert.equal(settlementSummary(payment).receivedAmount,33);assert.equal(settlementSummary(payment).outstanding,34);payment.settlements.push({count:1,date:"2026-11-02"});assert.equal(settlementSummary(payment).receivedAmount,67);value.finance!.payments.p=payment;assert.ok(isFinance(value.finance));payment.settlements.push({count:1,date:"2026-11-03"});assert.equal(isFinance(value.finance),false);});

test("정산 인원 선택을 바꾸면 추가 버튼 없이 새 기록이 생성되고 기존 수령일은 유지된다",()=>{const payment={gross:90000,split:3,method:"card" as const,settled:false,settledDate:"2026-11-01",settlements:[{count:1,date:"2026-11-01"}]};assert.deepEqual(resizeSettlements(payment,2,"2026-11-02"),[{count:1,date:"2026-11-01"},{count:1,date:"2026-11-02"}]);assert.deepEqual(resizeSettlements(payment,0,"2026-11-02"),[]);assert.equal(settlementSummary({...payment,settlements:resizeSettlements(payment,2,"2026-11-02")}).outstanding,0);});

test("하루 사용 가능액은 선택일까지의 지출과 이번 주 남은 약속만 반영한다", () => {
  const value = data();
  value.expenses = [
    { id: "today", date: "2026-11-03", amount: 20000, category: "식비", memo: "" },
    { id: "later", date: "2026-11-04", amount: 40000, category: "식비", memo: "" },
  ];
  value.finance!.plans = [
    { id: "past", date: "2026-11-02", amount: 10000, memo: "" },
    { id: "this-week", date: "2026-11-07", amount: 24000, memo: "" },
    { id: "next-week", date: "2026-11-09", amount: 8000, memo: "" },
  ];
  assert.deepEqual(dailySpendingAllowance(value, "2026-11-03"), {
    available: 6000, remaining: 60000, reserved: 24000, days: 6,
  });
});


test("약속은 여러 지출과 연결해도 유지되고 실제 합계만 소비에 한 번 반영한다", () => {
  const value = data();
  value.finance!.plans = [{ id: "plan", date: "2026-11-03", amount: 50000, memo: "데이트" }];
  value.expenses = [
    { id: "dinner", date: "2026-11-03", amount: 24000, category: "식비", memo: "저녁" },
    { id: "cafe", date: "2026-11-03", amount: 9000, category: "카페", memo: "커피" },
  ];
  const week = getPeriod("weekly", 1, "2026-11-03");
  assert.equal(financeSummary(value, week).reserved, 50000);
  value.finance = linkPlanExpenses(value, "plan", ["dinner", "cafe"]);
  const result = planSummary(value, value.finance.plans[0]);
  assert.equal(value.finance.plans.length, 1);
  assert.equal(value.expenses.length, 2);
  assert.equal(result.completed, true);
  assert.equal(result.actual, 33000);
  assert.equal(financeSummary(value, week).spent, 33000);
  assert.equal(financeSummary(value, week).reserved, 0);
  assert.equal(dailySpendingAllowance(value, "2026-11-03").reserved, 0);
  assert.equal(cashFlow(value, "2026-11").planned, 0);
  const restored = JSON.parse(JSON.stringify(value));
  assert.ok(isFinance(restored.finance));
  assert.equal(planSummary(restored, restored.finance.plans[0]).actual, 33000);
});

test("연결된 지출 수정·삭제·복원은 약속 실제 합계와 완료 상태에 반영된다", () => {
  const value = data();
  value.finance!.plans = [{ id: "plan", date: "2026-11-03", amount: 50000, memo: "" }];
  const expense = { id: "expense", date: "2026-11-03", amount: 20000, category: "식비", memo: "" };
  value.expenses = [expense];
  value.finance = linkPlanExpenses(value, "plan", [expense.id]);
  value.expenses = [{ ...expense, amount: 25000 }];
  assert.equal(planSummary(value, value.finance.plans[0]).actual, 25000);
  value.expenses = [];
  assert.equal(planSummary(value, value.finance.plans[0]).completed, false);
  assert.equal(financeSummary(value, getPeriod("weekly", 1, "2026-11-03")).reserved, 50000);
  assert.ok(isFinance(value.finance));
  value.expenses = [expense];
  assert.equal(planSummary(value, value.finance.plans[0]).completed, true);
  value.finance = linkPlanExpenses(value, "plan", []);
  assert.equal(planSummary(value, value.finance.plans[0]).completed, false);
  assert.equal(value.expenses.length, 1);
});

test("없는 지출·중복 지출·다른 약속의 지출은 연결할 수 없다", () => {
  const value = data();
  value.finance!.plans = [
    { id: "one", date: "2026-11-03", amount: 50000, memo: "" },
    { id: "two", date: "2026-11-03", amount: 50000, memo: "" },
  ];
  value.expenses = [{ id: "expense", date: "2026-11-03", amount: 20000, category: "식비", memo: "" }];
  assert.throws(() => linkPlanExpenses(value, "one", ["missing"]));
  assert.throws(() => linkPlanExpenses(value, "missing", ["expense"]));
  assert.throws(() => linkPlanExpenses(value, "one", ["expense", "expense"]));
  value.finance = linkPlanExpenses(value, "one", ["expense"]);
  assert.throws(() => linkPlanExpenses(value, "two", ["expense"]));
  value.finance.plans[1].expenseIds = ["expense"];
  assert.equal(isFinance(value.finance), false);
  value.finance.plans[1].expenseIds = [];
  value.finance.plans[0].expenseIds = ["expense", "expense"];
  assert.equal(isFinance(value.finance), false);
});

test("기존 약속과 나중 날짜의 지출은 과거 일 예산에서 잘못 완료 처리하지 않는다", () => {
  const value = data();
  value.finance!.plans = [{ id: "plan", date: "2026-11-05", amount: 50000, memo: "" }];
  assert.ok(isFinance(value.finance));
  value.expenses = [{ id: "expense", date: "2026-11-05", amount: 20000, category: "식비", memo: "" }];
  value.finance = linkPlanExpenses(value, "plan", ["expense"]);
  assert.equal(dailySpendingAllowance(value, "2026-11-03").reserved, 50000);
  assert.equal(dailySpendingAllowance(value, "2026-11-05").reserved, 0);
});


test("정산 후 부족액은 미수금을 한 번만 더하고 이미 받은 정산은 중복 가산하지 않는다", () => {
  const value = data();
  value.finance!.openingDate = "2026-11-01";
  value.finance!.openingBalance = 0;
  value.expenses = [{ id: "dinner", date: "2026-11-03", amount: 20000, category: "식비", memo: "" }];
  value.finance!.payments.dinner = { gross: 80000, split: 4, method: "cash", settled: false, settledDate: "2026-11-03" };
  let flow = cashFlow(value, "2026-11");
  assert.equal(flow.balance, -80000);
  assert.equal(flow.receivable, 60000);
  assert.equal(flow.balanceAfterReceivables, -20000);
  assert.equal(flow.shortfallAfterReceivables, 20000);
  value.finance!.payments.dinner.settlements = [{ count: 1, date: "2026-11-06" }, { count: 1, date: "2026-12-01" }];
  flow = cashFlow(value, "2026-11");
  assert.equal(flow.balance, -60000);
  assert.equal(flow.receivable, 40000);
  assert.equal(flow.shortfallAfterReceivables, 20000);
  value.finance!.incomes = [{ id: "income", date: "2026-11-01", amount: 30000, memo: "" }];
  flow = cashFlow(value, "2026-11");
  assert.equal(flow.balanceAfterReceivables, 10000);
  assert.equal(flow.shortfallAfterReceivables, 0);
});


test("11월 1일 시작 잔액으로 10월 말 잔액을 표시하며 11월 수입을 섞지 않는다", () => {
  const value = data();
  value.finance!.openingDate = "2026-11-01";
  value.finance!.openingBalance = 100000;
  value.finance!.incomes = [{ id: "income", date: "2026-11-01", amount: 50000, memo: "" }];
  assert.equal(cashFlow(value, "2026-10").balance, 100000);
  assert.equal(cashFlow(value, "2026-11").balance, 150000);
});

test("기준일 이전 월말 잔액은 수입·정산·카드·할부·고정비·저축을 역산한다", () => {
  const value = data();
  const finance = value.finance!;
  finance.openingDate = "2026-11-15";
  finance.openingBalance = 100000;
  finance.billingDay = 15;
  finance.closingDay = 31;
  finance.billingOffset = 1;
  finance.incomes = [
    { id: "oct-income", date: "2026-10-01", amount: 50000, memo: "" },
    { id: "nov-income", date: "2026-11-01", amount: 10000, memo: "" },
    { id: "future-income", date: "2026-11-20", amount: 99999, memo: "" },
  ];
  value.expenses = [
    { id: "cash", date: "2026-10-05", amount: 20000, category: "식비", memo: "" },
    { id: "card", date: "2026-09-10", amount: 30000, category: "식비", memo: "" },
  ];
  finance.payments.cash = { gross: 40000, split: 2, method: "cash", settled: true, settledDate: "2026-10-10" };
  finance.payments.card = { gross: 30000, split: 1, method: "card", settled: false, settledDate: "2026-09-10" };
  finance.fixedExpenses = [
    { id: "fixed-cash", date: "2026-10-03", endMonth: "2026-10", amount: 5000, memo: "", method: "cash" },
    { id: "fixed-card", date: "2026-09-05", endMonth: "2026-09", amount: 4000, memo: "", method: "card" },
  ];
  finance.installments = [{ id: "installment", date: "2026-10-15", amount: 20000, months: 2, memo: "" }];
  finance.savings = [
    { id: "deposit", date: "2026-10-07", amount: 7000, memo: "", direction: "deposit" },
    { id: "withdraw", date: "2026-10-08", amount: 2000, memo: "", direction: "withdraw" },
  ];
  assert.equal(cashFlow(value, "2026-09").balance, 114000);
  assert.equal(cashFlow(value, "2026-10").balance, 90000);
  // Moving the opening anchor to that reconstructed balance preserves the result.
  const earlier = structuredClone(value);
  earlier.finance!.openingDate = "2026-10-01";
  earlier.finance!.openingBalance = 114000;
  assert.equal(cashFlow(earlier, "2026-10").balance, 90000);
});
