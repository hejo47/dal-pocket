import { formatMoney } from "@/lib/pocket";

export function MoneyRow({ label, amount }: { label: string; amount: number }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-black-010 py-3 last:border-0">
    <dt className="min-w-0 text-sm leading-150 text-black-030">{label}</dt>
    <dd className="font-numbers ml-auto break-all text-base font-semibold leading-150 text-black-100">{formatMoney(amount)}<span className="text-xs font-medium">원</span></dd>
  </div>;
}
