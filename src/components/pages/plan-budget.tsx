"use client";

import { useState } from "react";
import { Plus, SquarePen } from "lucide-react";
import { PlanRecord } from "@/components/pages/plan-record";
import { PlanEditor } from "@/components/pages/plan-editor";
import { usePocket } from "@/components/providers/pocket-provider";
import { SectionCard } from "@/components/ui/section-card";
import { IconButton } from "@/components/ui/icon-button";
import { RecordRemoveButton } from "@/components/ui/record-remove-button";
import { financeOf, planSummary } from "@/lib/finance";
import type { PlanEntry } from "@/lib/finance";

export function PlanBudget({ month }: { month: string }) {
  const pocket = usePocket();
  const finance = financeOf(pocket.data);
  const plans = finance.plans.filter((entry) => entry.date.slice(0, 7) === month).sort((a, b) => a.date.localeCompare(b.date));
  const pending = plans.filter((plan) => !planSummary(pocket.data, plan).completed);
  const completed = plans.filter((plan) => planSummary(pocket.data, plan).completed);
  const [editor, setEditor] = useState<{ plan?: PlanEntry } | null>(null);
  const date = editor?.plan?.date ?? (pocket.today.startsWith(month) ? pocket.today : month + "-01");
  return <SectionCard title="약속 예산" action={<IconButton label="약속 예산 추가" onClick={() => setEditor({})}><Plus /></IconButton>}>
    <p className="text-xs leading-160 text-black-030">약속 날짜별로 쓸 금액을 정해두면 하루 사용 가능액에서 확보해둬요.</p>
    {plans.length ? [{ label: "기록 대기", plans: pending }, { label: "기록 완료", plans: completed }].filter((group) => group.plans.length > 0).map((group) => <div key={group.label} className="flex flex-col gap-1">
      <h3 className="pt-2 text-xs font-semibold text-black-030">{group.label} · {group.plans.length}건</h3>
      {group.plans.map((plan) => <PlanRecord key={plan.id} plan={plan} action={<>
        <IconButton label={`${plan.memo || "약속"} 수정`} onClick={() => setEditor({ plan })}><SquarePen /></IconButton><RecordRemoveButton planned label={`${plan.memo || "약속"} 예정 해제`} onClick={() => pocket.saveFinance({ ...finance, plans: finance.plans.filter((entry) => entry.id !== plan.id) })} />
      </>} />)}
    </div>) : <p className="py-2 text-sm text-black-030">등록된 약속 예산이 없어요.</p>}
    {editor && <PlanEditor key={editor.plan?.id ?? "new"} date={date} plan={editor.plan} open onOpenChange={(open) => { if (!open) setEditor(null); }} />}
  </SectionCard>;
}
