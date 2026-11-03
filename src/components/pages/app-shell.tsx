"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarDays, ChartNoAxesCombined, House, NotebookPen, Plus, UserRound, Wallet, WalletCards } from "lucide-react";

import { ExpenseEditor } from "@/components/pages/expense-editor";
import { usePocket } from "@/components/providers/pocket-provider";
import { PocketToasts } from "@/components/providers/pocket-toasts";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "홈", icon: House }, { href: "/expenses", label: "내역", icon: NotebookPen },
  { href: "/calendar", label: "달력", icon: CalendarDays },
  { href: "/analysis", label: "분석", icon: ChartNoAxesCombined }, { href: "/budget", label: "예산", icon: Wallet },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pocket = usePocket();
  const showAdd = pathname !== "/budget" && pathname !== "/calendar" && pathname !== "/finance" && pathname !== "/account";
  return <div className="mx-auto flex min-h-dvh w-full max-w-page flex-col border-x border-black-010 bg-white">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:px-6 focus:py-3">본문 바로가기</a>
    <header className="flex flex-col gap-4 border-b border-black-010 px-6 pt-5 pb-4">
      <div className="flex items-center justify-between gap-4"><Link href="/" className="font-pretendard tracking-pt text-base font-semibold leading-150">달주머니</Link><div className="flex items-center gap-2"><Link href="/finance" aria-label="현금 흐름" title="현금 흐름" className="inline-flex px-3 py-3 text-black-100 hover:text-black-030"><IconContainer size="slg"><WalletCards /></IconContainer></Link><Link href="/account" aria-label="계정" title="계정" className="inline-flex px-3 py-3 text-black-100 hover:text-black-030"><IconContainer size="slg"><UserRound /></IconContainer></Link></div></div>
      {pathname !== "/finance" && <div className="flex gap-1 rounded-lg bg-black-002 p-1" aria-label="예산 관리 단위">{(["weekly", "monthly"] as const).map((mode) => <PillButton key={mode} variant={pocket.data.mode === mode ? "filled" : "ghost"} className="flex-1" aria-pressed={pocket.data.mode === mode} disabled={!pocket.ready} onClick={() => pocket.setMode(mode)}>{mode === "weekly" ? "주간" : "월간"}</PillButton>)}</div>}
    </header>
    {pocket.ready && pocket.data.isDemo && <div className="flex flex-col gap-4 px-6 pt-4">
      {pocket.ready && pocket.data.isDemo && <div className="flex items-center justify-between gap-3 rounded-lg bg-black-002 px-3 py-2"><span className="text-xs leading-150 text-black-030">예시 데이터를 보고 있어요</span><PillButton variant="ghost" size="sm" onClick={pocket.startOwnRecords}>내 기록 시작</PillButton></div>}
    </div>}
    <main id="main-content" className="flex flex-1 flex-col px-6 pt-6 pb-footer">{children}</main>
    {showAdd && <div className="fixed inset-x-0 bottom-20 z-40 mx-auto flex w-full max-w-page justify-end px-6"><PillButton id="add-expense" aria-label="지출 추가" title="지출 추가" size="icon" className="rounded-full px-3 py-3 shadow-lg" onClick={() => pocket.openEditor()} disabled={!pocket.ready}><IconContainer size="slg"><Plus /></IconContainer></PillButton></div>}
    <footer className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-page flex-col gap-2 border-t border-black-010 bg-white px-6 pt-0 pb-0">
      <nav aria-label="주요 화면" className="flex w-full gap-2">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("flex flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 py-3 text-xs leading-150", pathname === href ? "border-black-100 text-black-100" : "border-transparent text-black-030")}><IconContainer size="slg"><Icon /></IconContainer>{label}</Link>)}</nav>
    </footer>
    <ExpenseEditor />
    <PocketToasts />
  </div>;
}
