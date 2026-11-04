"use client";

import { IconLink } from "@/components/ui/icon-link";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { CalendarDays, ChartNoAxesCombined, House, NotebookPen, Plus, UserRound, WalletCards } from "lucide-react";

import { ExpensesPreview } from "@/components/pages/expenses-page";
import { SignedOutPage } from "@/components/pages/signed-out-page";
import { HomePage } from "@/components/pages/home-page";
import { ExpenseEditor } from "@/components/pages/expense-editor";
import { usePocket } from "@/components/providers/pocket-provider";
import { PocketToasts } from "@/components/providers/pocket-toasts";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "홈", icon: House }, { href: "/expenses", label: "내역", icon: NotebookPen },
  { href: "/calendar", label: "달력", icon: CalendarDays },
  { href: "/analysis", label: "분석", icon: ChartNoAxesCombined },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pocket = usePocket();
  const [signedIn, setSignedIn] = useState<boolean | null>(hasSupabaseAuthConfig ? null : false);
  useEffect(() => {
    if (!hasSupabaseAuthConfig) return;
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  const supportsDaily = pathname === "/" || pathname === "/budget";
  const modeOptions = supportsDaily ? (["daily", "weekly", "monthly"] as const) : (["weekly", "monthly"] as const);
  const activeMode = supportsDaily && pocket.dailyView ? "daily" : pocket.data.mode;
  const showAdd = pathname !== "/budget" && pathname !== "/calendar" && pathname !== "/finance" && pathname !== "/account";
  return <div className="mx-auto flex min-h-dvh w-full max-w-page flex-col border-x border-black-010 bg-white">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:px-6 focus:py-3">본문 바로가기</a>
    <header className="flex flex-col gap-4 border-b border-black-010 px-6 pt-5 pb-4">
      <div className="flex items-center justify-between gap-4"><Link href="/" className="font-pretendard tracking-pt text-base font-semibold leading-150">달주머니</Link><div className="flex items-center gap-2"><IconLink href="/finance" label="현금 흐름"><WalletCards /></IconLink><IconLink href="/account" label="계정"><UserRound /></IconLink></div></div>
      {(signedIn || pathname === "/" || pathname === "/expenses" || pathname === "/budget") && pathname !== "/account" && pathname !== "/finance" && pathname !== "/analysis" && pathname !== "/calendar" && <div className="flex gap-1 rounded-lg bg-black-002 p-1" aria-label="예산 관리 단위">{modeOptions.map((mode) => <PillButton key={mode} variant={activeMode === mode ? "filled" : "ghost"} className="flex-1" aria-pressed={activeMode === mode} disabled={!pocket.ready} onClick={() => pocket.setMode(mode)}>{mode === "daily" ? "일간" : mode === "weekly" ? "주간" : "월간"}</PillButton>)}</div>}
    </header>
    <main id="main-content" className="flex flex-1 flex-col px-6 pt-6 pb-footer">
      {pathname === "/account" || signedIn ? children
        : pathname === "/" ? <HomePage masked checkingAuth={signedIn === null} />
        : pathname === "/expenses" ? <ExpensesPreview checking={signedIn === null} />
        : <SignedOutPage key={pathname} pathname={pathname} checking={signedIn === null} />}
    </main>
    {signedIn && showAdd && <div className="fixed inset-x-0 bottom-20 z-40 mx-auto flex w-full max-w-page justify-end px-6"><PillButton id="add-expense" aria-label="지출 추가" title="지출 추가" size="icon" className="rounded-full px-3 py-3 shadow-lg" onClick={() => pocket.openEditor()} disabled={!pocket.ready}><IconContainer size="slg"><Plus /></IconContainer></PillButton></div>}
    <footer className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-page flex-col gap-2 border-t border-black-010 bg-white px-6 pt-0 pb-0">
      <nav aria-label="주요 화면" className="flex w-full gap-2">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("flex flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 py-3 text-xs leading-150", pathname === href ? "border-black-100 text-black-100" : "border-transparent text-black-030")}><IconContainer size="slg"><Icon /></IconContainer>{label}</Link>)}</nav>
    </footer>
    {signedIn && <><ExpenseEditor /><PocketToasts /></>}
  </div>;
}
