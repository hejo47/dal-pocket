"use client";

import { useEffect, useRef } from "react";

import { usePocket } from "@/components/providers/pocket-provider";
import { toast, Toaster } from "@/components/ui/sonner";

const SAVE_TOAST = "pocket-save";

export function PocketToasts() {
  const { ready, storage, notice, dismissNotice, retryCloud, loadServerCopy } = usePocket();
  const savingToast = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (storage === "error" || storage === "conflict") {
      savingToast.current = true;
      toast.error(storage === "error" ? "서버에 저장하지 못했습니다" : "다른 화면에서 기록이 변경됐습니다", {
        id: SAVE_TOAST, duration: Infinity,
        description: "현재 기록은 이 기기에 보관되어 있습니다.",
        action: { label: storage === "error" ? "다시 저장" : "서버 기록 불러오기", onClick: () => { void (storage === "error" ? retryCloud() : loadServerCopy()); } },
      });
      return;
    }
    if (storage === "syncing" || storage === "connecting") {
      if (notice || savingToast.current) {
        savingToast.current = true;
        toast.loading("저장 중…", { id: SAVE_TOAST, duration: Infinity, description: undefined, action: undefined });
      }
      return;
    }
    if (!notice && !savingToast.current) return;
    savingToast.current = false;
    toast.success(notice?.message ?? "저장 완료", {
      id: SAVE_TOAST, duration: notice?.action ? 8000 : 3000, description: undefined,
      action: notice?.action ? { label: notice.action.label, onClick: () => { dismissNotice(); notice.action?.onClick(); } } : undefined,
      onDismiss: dismissNotice, onAutoClose: dismissNotice,
    });
  }, [ready, storage, notice, dismissNotice, retryCloud, loadServerCopy]);

  return <Toaster />;
}
