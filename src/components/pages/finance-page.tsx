"use client";

import { PeriodPicker } from "@/components/ui/period-picker";

import { SpendingBreakdown } from "@/components/pages/analysis-page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoneyRow } from "@/components/ui/money-row";
import { SavingsSection } from "@/components/pages/savings-section";
import { FixedExpenses } from "@/components/pages/fixed-expenses";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { usePocket } from "@/components/providers/pocket-provider";
import { DateField, FieldLabel, FieldHint, TextField, SelectField } from "@/components/ui/form-field";
import { PillButton } from "@/components/ui/pill-button";
import { ScreenTitle, PageSkeleton } from "@/components/ui/screen-title";
import { financeOf, cashFlow, installmentDue, nextMonth } from "@/lib/finance";
import type { Finance, Installment } from "@/lib/finance";
import { formatMoney, isDateKey, parseAmount, validAmount } from "@/lib/pocket";
function FinanceView({ initialMonth }: { initialMonth: string }) {
 const pocket = usePocket(); const finance = financeOf(pocket.data);
 const [month,setMonth] = useState(initialMonth); const [kind,setKind] = useState<"incomes"|"plans"|"installments">("incomes");
 const [date,setDate] = useState(pocket.today); const [amount,setAmount] = useState(""); const [memo,setMemo] = useState(""); const [months,setMonths] = useState("3");
 const [balance,setBalance] = useState(String(finance.openingBalance)); const [openingDate,setOpeningDate] = useState(finance.openingDate === "2000-01-01" ? pocket.today : finance.openingDate);
 const [billingDay,setBillingDay] = useState(String(finance.billingDay)); const [closingDay,setClosingDay] = useState(String(finance.closingDay ?? 31)); const [billingOffset,setBillingOffset] = useState(String(finance.billingOffset ?? 1));
 const [registerOpen, setRegisterOpen] = useState(false);
 const [fixedOpen, setFixedOpen] = useState(false);
 const flow = cashFlow(pocket.data,month);
 const followingMonth = nextMonth(month);
 const nextInstallment = finance.installments.reduce((sum, item) => sum + installmentDue(item, followingMonth), 0);
 function save(next: Finance) { pocket.saveFinance(next); }
 return <div className="flex w-full min-w-0 max-w-content flex-col gap-6"><ScreenTitle title="지출 분석·현금 흐름" subtitle="선택한 달의 수입과 지출" action={<PillButton type="button" size="sm" variant="outline" onClick={() => { setKind("incomes"); setRegisterOpen(true); }}>수입 등록</PillButton>} />
    <PeriodPicker date={month + "-01"} onChange={(date) => setMonth(date.slice(0, 7))} />
 <section className="flex flex-col gap-3 rounded-xl border border-black-010 p-4"><h2 className="font-semibold">{Number(month.slice(5))}월 월말 예상 현금 잔액</h2>{finance.openingDate === "2000-01-01" && <p className="text-xs text-red-2">아래 현금·카드 설정에서 시작 잔액과 기준일을 먼저 저장해주세요.</p>}{finance.openingDate !== "2000-01-01" && (finance.openingDate.slice(0, 7) <= month ? <>
   <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><p className={"font-numbers text-3xl " + (flow.balance < 0 ? "text-red-2" : "text-black-100")}>{formatMoney(flow.balance)}원</p><span className="font-numbers text-xs text-black-030">미수금 {formatMoney(flow.receivable)}원</span></div>
   <p className="text-sm leading-160 text-black-030">{finance.openingDate}의 시작 잔액부터 {month} 말일까지 계산합니다. 등록한 수입과 받은 정산을 더하고, 현금 결제·카드 출금·할부·현금 고정비·순저축을 뺍니다.</p>
 </> : <p className="text-sm leading-160 text-black-030">현금 계산 시작일({finance.openingDate}) 이전 달은 잔액을 계산하지 않습니다.</p>)}<dl><MoneyRow label="이달 수입" amount={finance.incomes.filter((entry) => entry.date.slice(0, 7) === month).reduce((sum, entry) => sum + entry.amount, 0)} /><MoneyRow label="이달 순저축" amount={flow.savedMonth - flow.withdrawnMonth} /><MoneyRow label="계산 기간 내 고정 출금" amount={flow.fixedCashOut} /><MoneyRow label="카드값 · 받은 정산 차감" amount={flow.cardBill} /><MoneyRow label="카드로 낸 고정비" amount={flow.dueThisMonth - flow.cardBill - flow.cardSettlements} /><MoneyRow label="이달 할부 납부" amount={flow.installmentMonth} /><MoneyRow label="카드 출금 합계" amount={flow.dueThisMonth} /><MoneyRow label="다음 달 할부 납부" amount={nextInstallment} /><MoneyRow label="남은 할부 원금" amount={flow.installmentOutstanding} /></dl>
 <p className="text-sm leading-160 text-black-030">카드 출금 합계에는 정산 차감 전 결제액과 카드 고정비가 들어가요. 할부 납부액은 별도로 표시해요. 받은 정산금은 현금 잔액에 따로 더해요.</p></section>
 <SpendingBreakdown month={month} />
 <details id="fixed-costs" open={fixedOpen} onToggle={(event) => setFixedOpen(event.currentTarget.open)} className="scroll-mt-4 rounded-xl border border-black-010 p-4">
   <summary className="cursor-pointer py-2 font-semibold">고정 지출 설정·내역</summary>
   <div className="pt-3"><FixedExpenses month={month} /></div>
 </details>
 <div id="savings" className="scroll-mt-4"><SavingsSection month={month} /></div>
 <details className="rounded-xl border border-black-010 p-4"><summary className="cursor-pointer py-2 font-semibold">현금·카드 결제 기준 설정</summary><form className="flex flex-col gap-3 pt-4" onSubmit={(event)=>{event.preventDefault();save({...finance,openingBalance:Number(balance),openingDate,billingDay:Number(billingDay),closingDay:Number(closingDay),billingOffset:Number(billingOffset)});}}>
 <FieldLabel htmlFor="opening-date">현금 계산 시작일</FieldLabel><DateField id="opening-date" required value={openingDate} onValueChange={(value) => setOpeningDate(value)} /><FieldLabel htmlFor="opening-balance">시작일의 현금 잔액</FieldLabel><TextField id="opening-balance" type="number" min={-1000000000} max={1000000000} required value={balance} onChange={(event)=>setBalance(event.target.value)} />
 <FieldLabel htmlFor="closing-day">카드 이용 마감일 (말일은 31)</FieldLabel><TextField id="closing-day" type="number" required min={1} max={31} value={closingDay} onChange={(event)=>setClosingDay(event.target.value)} /><FieldLabel htmlFor="billing-offset">마감 월로부터 출금 월</FieldLabel><SelectField id="billing-offset" value={billingOffset} options={[{value:"0",label:"마감한 당월"},{value:"1",label:"다음 달"},{value:"2",label:"다다음 달"}]} onChange={(event)=>setBillingOffset(event.target.value)} /><FieldLabel htmlFor="billing-day">카드 결제일</FieldLabel><TextField id="billing-day" type="number" required min={1} max={31} value={billingDay} onChange={(event)=>setBillingDay(event.target.value)} /><FieldHint>예: 마감일 31 · 다음 달 · 결제일 15 → 전월 1일~말일 사용분이 이번 달 15일에 출금됩니다. 이 화면의 잔액은 월말까지 등록된 예정 수입·출금을 포함한 예상치입니다.</FieldHint><PillButton type="submit">기준 저장</PillButton></form></details>
 <PillButton type="button" variant="outline" className="self-start" onClick={() => { setKind("installments"); setRegisterOpen(true); }}>할부·약속 등록</PillButton>
 <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
   <DialogContent>
     <DialogHeader><DialogTitle>{kind === "incomes" ? "수입 등록" : kind === "plans" ? "약속 비용 등록" : "할부 등록"}</DialogTitle><DialogDescription>날짜와 금액을 입력해주세요.</DialogDescription></DialogHeader>
 <form className="flex min-h-0 flex-col gap-3 overflow-y-auto" onSubmit={(event)=>{event.preventDefault(); const parsed=parseAmount(amount); if(!validAmount(parsed)||!date||kind === "installments" && (Number(months)<2 || Number(months)>60))return; const item={id:crypto.randomUUID(),date,amount:parsed,memo,months:Number(months)};save({...finance,[kind]:[...finance[kind],item]});setAmount("");setMemo("");setRegisterOpen(false);}}><SelectField aria-label="기록 종류" value={kind} options={[{value:"incomes",label:"수입"},{value:"plans",label:"약속 예상 사용액"},{value:"installments",label:"할부 (생활 예산 제외)"}]} onChange={(event)=>setKind(event.target.value as typeof kind)} /><FieldLabel htmlFor="finance-date">{kind === "installments" ? "첫 납부 월의 날짜" : "예정·발생 날짜"}</FieldLabel><DateField id="finance-date" required value={date} onValueChange={(value) => setDate(value)} /><FieldLabel htmlFor="finance-amount">{kind === "installments" ? "할부 원금 총액 (무이자 기준)" : "금액"}</FieldLabel><TextField id="finance-amount" required inputMode="numeric" value={amount} onChange={(event)=>setAmount(event.target.value.replace(/\D/g,""))} /><FieldLabel htmlFor="finance-memo">내용·메모</FieldLabel><TextField id="finance-memo" maxLength={80} value={memo} onChange={(event)=>setMemo(event.target.value)} />{kind === "installments" && <><FieldLabel htmlFor="installment-months">할부 개월 수</FieldLabel><TextField id="installment-months" type="number" min={2} max={60} required value={months} onChange={(event)=>setMonths(event.target.value)} /><FieldHint>납부일은 위 카드 결제일을 따릅니다. 원금은 개월 수로 배분하며 이자는 포함하지 않습니다.</FieldHint></>}<PillButton type="submit">등록</PillButton></form>
   </DialogContent>
 </Dialog>
 {(["incomes","plans","installments"] as const).map((type)=><section key={type} className="flex flex-col gap-3 rounded-xl border border-black-010 p-4"><h2 className="font-semibold">{type === "incomes" ? "수입" : type === "plans" ? "약속 예정 금액" : "할부 내역"}</h2>{finance[type].filter((item)=>type === "installments" ? installmentDue(item as Installment,month)>0 : item.date.slice(0,7)===month).map((item)=><div key={item.id} className="flex items-center justify-between gap-2 border-t border-black-010 py-3"><div className="flex min-w-0 flex-col gap-1"><span className="text-xs text-black-030">{item.date}</span><span className="break-words text-sm">{item.memo || "내용 없음"}</span><span className="font-numbers text-sm">{formatMoney(item.amount)}원 {type === "installments" && ` / ${(item as Installment).months}개월 · 이번 달 ${formatMoney(installmentDue(item as Installment,month))}원`}</span></div><PillButton variant="ghost" size="sm" onClick={()=>save({...finance,[type]:finance[type].filter((entry)=>entry.id!==item.id)})}>{type === "plans" ? "예정 해제" : "삭제"}</PillButton></div>)}<FieldHint>{type === "plans" ? "실제 지출을 기록한 약속은 예정 해제하여 중복 확보를 피하세요." : "등록한 내역이 이곳에 표시됩니다."}</FieldHint></section>)}
 </div>;
}
export function FinancePage(){const pocket=usePocket();const setting=financeOf(pocket.data);const requestedMonth=useSearchParams().get("month");const month=requestedMonth && isDateKey(requestedMonth + "-01") ? requestedMonth : pocket.today.slice(0,7);return pocket.ready ? <FinanceView initialMonth={month} key={`${month}-${setting.openingDate}-${setting.openingBalance}-${setting.billingDay}-${setting.closingDay}-${setting.billingOffset}`} /> : <PageSkeleton />;}
