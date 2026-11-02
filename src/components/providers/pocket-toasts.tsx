"use client";

import { useEffect, useRef } from "react";

import { usePocket } from "@/components/providers/pocket-provider";
import { toast, Toaster } from "@/components/ui/sonner";

const STORAGE_TOAST = "pocket-storage";
const NOTICE_TOAST = "pocket-notice";

export function PocketToasts() {
  const { ready, storage, data, notice, dismissNotice, retryCloud, loadServerCopy } = usePocket();
  const previousStorage = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || previousStorage.current === storage) return;
    const previous = previousStorage.current;
    previousStorage.current = storage;

    if (storage === "syncing") {
      const timer = window.setTimeout(() => toast.loading("서버에 저장 중", { id: STORAGE_TOAST }), 400);
      return () => window.clearTimeout(timer);
    }
    if (storage === "error" || storage === "conflict") {
      toast.error(storage === "error" ? "서버 저장을 기다리고 있어요" : "다른 화면에서 기록이 변경됐어요", {
        id: STORAGE_TOAST, duration: Infinity,
        description: "현재 기록은 이 기기에 보관되어 있습니다.",
        action: { label: storage === "error" ? "다시 저장" : "서버 기록 불러오기", onClick: () => { void (storage === "error" ? retryCloud() : loadServerCopy()); } },
      });
    } else if (storage === "synced" && previous !== null) {
      toast.dismiss(STORAGE_TOAST);
    } else if (storage === "local") {
      toast.dismiss(STORAGE_TOAST);
    } else if (storage === "connecting" && (previous === "error" || previous === "conflict")) {
      toast.loading("저장 상태 확인 중", { id: STORAGE_TOAST });
    }
  }, [ready, storage, data.isDemo, retryCloud, loadServerCopy]);

  useEffect(() => {
    if (!notice) return;
    toast(notice.message, {
      id: NOTICE_TOAST, duration: notice.action ? 8000 : 3000,
      action: notice.action ? { label: notice.action.label, onClick: () => { dismissNotice(); notice.action?.onClick(); } } : undefined,
      onDismiss: dismissNotice, onAutoClose: dismissNotice,
    });
  }, [notice, dismissNotice]);

  return <Toaster />;
}
