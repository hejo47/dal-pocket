import type { ReactNode } from "react";
import { PillButton } from "@/components/ui/pill-button";

export function SignInNotice({ children, checking = false }: { children: ReactNode; checking?: boolean }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black-002 px-3 py-3">
    <p className="text-sm text-black-030">{checking ? "로그인 상태를 확인하고 있어요." : children}</p>
    {!checking && <PillButton href="/account" size="sm">로그인</PillButton>}
  </div>;
}
