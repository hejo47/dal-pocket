import type { ReactNode } from "react";

export function ScreenTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <header className="flex w-full items-center justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-1">{subtitle && <p className="text-xs leading-160 text-black-030">{subtitle}</p>}<h1 className="font-point text-2xl leading-140">{title}</h1></div>
    {action}
  </header>;
}
export function PageSkeleton() {
  return <div className="flex w-full flex-col gap-6 py-4">
    <div role="status" aria-label="화면을 불러오는 중" className="flex animate-pulse flex-col gap-6">
      <div className="h-8 w-36 rounded bg-black-002" />
      <div className="h-36 rounded-lg bg-black-002" />
      <div className="h-24 rounded-lg bg-black-002" />
    </div>
    <div className="pocket-loading-recovery flex flex-col items-start gap-3 text-sm">
      <p>화면을 여는 데 시간이 걸리고 있어요.</p>
      {/* A native link works even if the application scripts never load. */}
      <a href="" className="rounded-lg bg-black-100 px-4 py-2 font-semibold text-white">현재 화면 새로고침</a>
    </div>
  </div>;
}
