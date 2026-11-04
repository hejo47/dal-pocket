export function BudgetUsage({ percent, label }: { percent: number | null; label: string }) {
  const fill = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  return <div className="flex flex-col gap-2">
    <p className="text-xs leading-150 text-black-030">{label}의 <span className="font-numbers font-semibold text-black-100">{percent === null ? "??" : percent}%</span> 사용</p>
    <div role="progressbar" aria-label={`${label} 사용률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent === null ? undefined : fill} aria-valuetext={percent === null ? "로그인 후 확인" : `${percent}% 사용`} className="overflow-hidden rounded-full bg-black-005">
      <div className="h-1 rounded-full bg-black-100" style={{ width: `${fill}%` }} />
    </div>
  </div>;
}
