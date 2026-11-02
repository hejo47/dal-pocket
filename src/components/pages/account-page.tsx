"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { usePocket } from "@/components/providers/pocket-provider";
import { ActionButtonRow } from "@/components/ui/action-button-row";
import { FieldError, FieldHint, FieldLabel, TextField } from "@/components/ui/form-field";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";
import { hasSupabaseAuthConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { adoptCloudPacket, clearLocalPocket, getLocalData } from "@/lib/pocket-storage";
import type { PocketPacket } from "@/lib/pocket-api";

export function AccountPage() {
  const pocket = usePocket();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [signUp, setSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuthConfig) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setAccountEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setAccountEmail(session?.user.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function finishSignIn() {
    const response = await fetch("/api/pocket/claim", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: getLocalData().isDemo ? null : getLocalData() }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? "기존 기록을 계정에 연결하지 못했습니다.");
    adoptCloudPacket(payload as PocketPacket);
    setAccountEmail(email.trim());
    setPassword("");
    setMessage("로그인했고, 이 브라우저의 기록을 계정에 연결했습니다.");
    router.refresh();
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      if (signUp) {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/account` } });
        if (authError) throw authError;
        if (data.session) await finishSignIn();
        else setMessage("가입 확인 메일을 보냈습니다. 메일의 링크를 확인한 뒤 로그인해주세요.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        await finishSignIn();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "요청을 처리하지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    try { await createClient().auth.signOut(); clearLocalPocket(); router.replace("/"); router.refresh(); }
    catch { setError("로그아웃하지 못했습니다."); setBusy(false); }
  }

  if (!pocket.ready) return <PageSkeleton />;
  return <div className="flex w-full max-w-content flex-col gap-6">
    <ScreenTitle title="계정" subtitle="로그인하면 폰과 PC에서 같은 기록을 볼 수 있어요." />
    {!hasSupabaseAuthConfig ? <div className="flex flex-col gap-3 rounded-lg border border-black-010 p-4"><p className="text-sm leading-150">Supabase Auth 연결 정보가 아직 설정되지 않았습니다.</p><FieldHint>프로젝트 URL과 Publishable key를 환경변수에 추가하면 이메일 가입과 로그인을 사용할 수 있습니다.</FieldHint></div>
      : accountEmail ? <div className="flex flex-col gap-4 rounded-lg border border-black-010 p-4"><p className="text-sm leading-150">로그인 중</p><p className="break-all text-sm leading-150 text-black-030">{accountEmail}</p><FieldHint>현재 기기의 저장 기록을 계정에 연결했습니다. 다른 기기에서도 같은 이메일로 로그인하세요.</FieldHint><ActionButtonRow buttons={[{ label: "로그아웃", variant: "outline", disabled: busy, onClick: signOut }]} /></div>
      : <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2"><FieldLabel htmlFor="account-email" required>이메일</FieldLabel><TextField id="account-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div>
        <div className="flex flex-col gap-2"><FieldLabel htmlFor="account-password" required>비밀번호</FieldLabel><TextField id="account-password" required minLength={8} type="password" autoComplete={signUp ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상" /></div>
        <FieldError>{error}</FieldError>{message && <FieldHint role="status">{message}</FieldHint>}
        <ActionButtonRow buttons={[{ label: busy ? "처리 중…" : signUp ? "이메일로 가입" : "로그인", type: "submit", disabled: busy }]} />
        <button className="self-center py-2 text-sm text-black-030 underline" type="button" onClick={() => { setSignUp((value) => !value); setError(""); setMessage(""); }}>{signUp ? "이미 계정이 있어요 · 로그인" : "처음 오셨나요? 이메일로 가입"}</button>
        <FieldHint>비밀번호는 달주머니에 저장되지 않고 Supabase Auth에서 안전하게 관리됩니다.</FieldHint>
      </form>}
  </div>;
}
