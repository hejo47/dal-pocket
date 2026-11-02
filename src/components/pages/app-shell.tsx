"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChartNoAxesCombined, House, NotebookPen, Plus, Type, Wallet, X } from "lucide-react";

import { ExpenseEditor } from "@/components/pages/expense-editor";
import { usePocket } from "@/components/providers/pocket-provider";
import { ActionButtonRow } from "@/components/ui/action-button-row";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "홈", icon: House }, { href: "/expenses", label: "내역", icon: NotebookPen },
  { href: "/analysis", label: "분석", icon: ChartNoAxesCombined }, { href: "/budget", label: "예산", icon: Wallet },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pocket = usePocket();
  const showAdd = pathname !== "/budget" && pathname !== "/typography";
  const storageLabel = { local: "이 기기에 저장", connecting: "저장 상태 확인 중", syncing: "서버에 저장 중", synced: pocket.data.isDemo ? "서버 연결됨" : "서버 저장 완료", error: "서버 저장 대기 · 이 기기에 보관 중", conflict: "다른 화면에서 변경된 기록이 있어요" }[pocket.storage];
  return <div className="mx-auto flex min-h-dvh w-full max-w-page flex-col border-x border-black-010 bg-white">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:px-6 focus:py-3">본문 바로가기</a>
    <header className="flex flex-col gap-4 border-b border-black-010 px-6 pt-5 pb-4">
      <div className="flex items-center justify-between gap-4"><Link href="/" className="font-pretendard tracking-pt text-base font-semibold leading-150">달주머니</Link><Link href="/typography" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs leading-150 text-black-030" aria-label="본문과 숫자 서체 비교"><IconContainer size="slg"><Type /></IconContainer>서체 비교</Link></div>
      <div className="flex gap-1 rounded-lg bg-black-002 p-1" aria-label="예산 관리 단위">{(["weekly", "monthly"] as const).map((mode) => <PillButton key={mode} variant={pocket.data.mode === mode ? "filled" : "ghost"} className="flex-1" aria-pressed={pocket.data.mode === mode} disabled={!pocket.ready} onClick={() => pocket.setMode(mode)}>{mode === "weekly" ? "주간" : "월간"}</PillButton>)}</div>
    </header>
    <div className="flex flex-col gap-4 px-6 pt-4">
      {pocket.ready && <div className="flex flex-wrap items-center justify-between gap-2" role="status"><span className="text-xs leading-150 text-black-030">{storageLabel}</span>{pocket.storage === "error" && <PillButton variant="outline" size="sm" onClick={() => { void pocket.retryCloud(); }}>다시 저장</PillButton>}{pocket.storage === "conflict" && <PillButton variant="outline" size="sm" onClick={() => { void pocket.loadServerCopy(); }}>서버 기록 불러오기</PillButton>}</div>}
      {pocket.ready && pocket.data.isDemo && <div className="flex items-center justify-between gap-3 rounded-lg bg-black-002 px-3 py-2"><span className="text-xs leading-150 text-black-030">예시 데이터를 보고 있어요</span><PillButton variant="ghost" size="sm" onClick={pocket.startOwnRecords}>내 기록 시작</PillButton></div>}
      {pocket.notice && <div role="status" className="flex items-center gap-2 border-l-2 border-black-100 bg-black-002 px-3 py-2"><p className="flex-1 text-xs leading-160">{pocket.notice.message}</p>{pocket.notice.action && <PillButton size="sm" variant="outline" onClick={pocket.notice.action.onClick}>{pocket.notice.action.label}</PillButton>}<PillButton size="icon" variant="ghost" aria-label="알림 닫기" onClick={pocket.dismissNotice}><IconContainer><X /></IconContainer></PillButton></div>}
    </div>
    <main id="main-content" className="flex flex-1 flex-col px-6 pt-6 pb-footer">{children}</main>
    <footer className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-page flex-col gap-2 border-t border-black-010 bg-white px-6 pt-4 pb-10">
      {showAdd && <ActionButtonRow buttons={[{ id: "add-expense", label: <><IconContainer size="slg"><Plus /></IconContainer>지출 추가</>, onClick: () => pocket.openEditor(), disabled: !pocket.ready }]} />}
      <nav aria-label="주요 화면" className="flex w-full gap-2">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("flex flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 py-3 text-xs leading-150", pathname === href ? "border-black-100 text-black-100" : "border-transparent text-black-030")}><IconContainer size="slg"><Icon /></IconContainer>{label}</Link>)}</nav>
    </footer>
    <ExpenseEditor />
  </div>;
}
