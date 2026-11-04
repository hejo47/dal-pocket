"use client";

import { useState } from "react";
import { Plus, SquarePen } from "lucide-react";
import { PlanEditor } from "@/components/pages/plan-editor";
import { usePocket } from "@/components/providers/pocket-provider";
import { SectionCard } from "@/components/ui/section-card";
import { IconButton } from "@/components/ui/icon-button";
import { RecordRemoveButton } from "@/components/ui/record-remove-button";
import { financeOf } from "@/lib/finance";
import type { MoneyEntry } from "@/lib/finance";
import { formatMoney, shortDate } from "@/lib/pocket";

export function PlanBudget({ month }: { month: string }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const plans = finance.plans.filter((entry) => entry.date.slice(0, 7) === month).sort((a, b) => a.date.localeCompare(b.date));
  const [editor, setEditor] = useState<{ plan?: MoneyEntry } | null>(null);
  const date = editor?.plan?.date ?? (pocket.today.startsWith(month) ? pocket.today : month + "-01");
  return <SectionCard title="약속 예산" action={<IconButton label="약속 예산 추가" onClick={() => setEditor({})}><Plus /></IconButton>}>
    <p className="text-xs leading-160 text-black-030">약속 날짜별로 쓸 금액을 정해두면 하루 사용 가능액에서 확보해둬요.</p>
    {plans.length ? plans.map((plan) => <div key={plan.id} className="flex items-center justify-between gap-2 border-t border-black-010 py-3">
      <div className="flex min-w-0 flex-col gap-1"><p className="text-xs text-black-030">{shortDate(plan.date)}</p><p className="break-words text-sm">{plan.memo || "약속"}</p><p className="font-numbers text-base font-semibold">{formatMoney(plan.amount)}원</p></div>
      <div className="flex shrink-0"><IconButton label={`${plan.memo || "약속"} 수정`} onClick={() => setEditor({ plan })}><SquarePen /></IconButton><RecordRemoveButton planned label={`${plan.memo || "약속"} 예정 해제`} onClick={() => pocket.saveFinance({ ...finance, plans: finance.plans.filter((entry) => entry.id !== plan.id) })} /></div>
    </div>) : <p className="py-2 text-sm text-black-030">등록된 약속 예산이 없어요.</p>}
    {editor && <PlanEditor key={editor.plan?.id ?? "new"} date={date} plan={editor.plan} open onOpenChange={(open) => { if (!open) setEditor(null); }} />}
  </SectionCard>;
}
