"use client";

import { PlanEditor } from "@/components/pages/plan-editor";
import { RecordAddMenu } from "@/components/ui/record-add-menu";
import { IconLink } from "@/components/ui/icon-link";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { setPocketAccount } from "@/lib/pocket-storage";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { CalendarDays, ChartNoAxesCombined, House, NotebookPen, Plus, UserRound } from "lucide-react";

import { ExpensesPreview } from "@/components/pages/expenses-page";
import { SignedOutPage } from "@/components/pages/signed-out-page";
import { HomePage } from "@/components/pages/home-page";
import { ExpenseEditor } from "@/components/pages/expense-editor";
import { usePocket } from "@/components/providers/pocket-provider";
import { PocketToasts } from "@/components/providers/pocket-toasts";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";

import { isDateKey } from "@/lib/pocket";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "홈", icon: House }, { href: "/expenses", label: "내역", icon: NotebookPen },
  { href: "/calendar", label: "달력", icon: CalendarDays },
  { href: "/analysis", label: "분석", icon: ChartNoAxesCombined },
];

const modes = ["daily", "weekly", "monthly"] as const;

function ModeButtons({ linkedMonth }: { linkedMonth?: string }) {
  const pocket = usePocket();
  const activeMode = linkedMonth ? "monthly" : pocket.dailyView ? "daily" : pocket.data.mode;
  return <div className="flex gap-1 rounded-lg bg-black-002 p-1" aria-label="예산 관리 단위">
    {modes.map((mode) => <PillButton key={mode} variant={activeMode === mode ? "filled" : "ghost"} className="flex-1"
      aria-pressed={activeMode === mode} disabled={!pocket.ready} onClick={() => {
        if (linkedMonth) {
          const url = new URL(window.location.href);
          url.searchParams.delete("month");
          url.searchParams.set("date", linkedMonth + "-01");
          window.history.replaceState(null, "", url);
        }
        pocket.setMode(mode);
      }}>{mode === "daily" ? "일간" : mode === "weekly" ? "주간" : "월간"}</PillButton>)}
  </div>;
}

function ExpenseModeButtons() {
  const { today } = usePocket();
  const month = useSearchParams().get("month") ?? "";
  const date = month + "-01";
  return <ModeButtons linkedMonth={isDateKey(date) && date <= today ? month : undefined} />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pocket = usePocket();
  const [planOpen, setPlanOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(hasSupabaseAuthConfig ? null : false);
  useEffect(() => {
    if (!hasSupabaseAuthConfig) return;
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setPocketAccount(session?.user.id ?? null);
      setSignedIn(Boolean(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  const showAdd = pathname !== "/budget" && pathname !== "/calendar" && pathname !== "/finance" && pathname !== "/account";
  return <div className="mx-auto flex min-h-dvh w-full max-w-page flex-col border-x border-black-010 bg-white">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:px-6 focus:py-3">본문 바로가기</a>
    <header className="flex flex-col gap-4 border-b border-black-010 px-6 pt-5 pb-4">
      <div className="flex items-center justify-between gap-4"><Link href="/" className="font-pretendard tracking-pt text-base font-semibold leading-150">달주머니</Link><div className="flex items-center gap-2"><IconLink href="/account" label="계정"><UserRound /></IconLink></div></div>
      {pathname === "/" || pathname === "/budget" ? <ModeButtons />
        : pathname === "/expenses" ? <Suspense fallback={<ModeButtons />}><ExpenseModeButtons /></Suspense> : null}
    </header>
    <main id="main-content" className="flex flex-1 flex-col px-6 pt-6 pb-footer">
      {pathname === "/account" || signedIn ? children
        : pathname === "/" ? <HomePage masked checkingAuth={signedIn === null} />
        : pathname === "/expenses" ? <ExpensesPreview checking={signedIn === null} />
        : <SignedOutPage key={pathname} pathname={pathname} checking={signedIn === null} />}
    </main>
    {signedIn && showAdd && <div className="fixed inset-x-0 bottom-20 z-40 mx-auto flex w-full max-w-page justify-end px-6"><RecordAddMenu side="top" onExpense={() => pocket.openEditor()} onPlan={() => setPlanOpen(true)} trigger={<PillButton id="add-expense" aria-label="지출·약속 추가" title="지출·약속 추가" size="icon" className="rounded-full px-3 py-3 shadow-lg" disabled={!pocket.ready}><IconContainer size="slg"><Plus /></IconContainer></PillButton>} /></div>}
    <footer className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-page flex-col gap-2 border-t border-black-010 bg-white px-6 pt-0 pb-0">
      <nav aria-label="주요 화면" className="flex w-full gap-2">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={(pathname === href || (pathname === "/finance" && href === "/analysis")) ? "page" : undefined} className={cn("flex flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 py-3 text-xs leading-150", (pathname === href || (pathname === "/finance" && href === "/analysis")) ? "border-black-100 text-black-100" : "border-transparent text-black-030")}><IconContainer size="slg"><Icon /></IconContainer>{label}</Link>)}</nav>
    </footer>
    {signedIn && <><ExpenseEditor />{planOpen && <PlanEditor date={pocket.today} open={planOpen} onOpenChange={setPlanOpen} />}<PocketToasts /></>}
  </div>;
}
