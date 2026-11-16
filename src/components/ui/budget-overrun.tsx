import { formatMoney } from "@/lib/pocket";

export function BudgetOverrun({ amount, label, parenthesized = false }: { amount: number; label?: string; parenthesized?: boolean }) {
  if (amount <= 0) return null;
  return <span className="text-xs leading-150 text-red-2">{parenthesized && "("}{label && `${label} `}<span className="font-numbers font-semibold">{formatMoney(amount)}원</span> 초과{parenthesized && ")"}</span>;
}
