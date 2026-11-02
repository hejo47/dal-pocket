"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, toast } from "sonner";
import { Check, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";

import { IconContainer } from "@/components/ui/icon-container";

export function Toaster() {
  return <Sonner theme="light" position="top-center" offset={16} mobileOffset={15} duration={3000} visibleToasts={2} closeButton
    containerAriaLabel="알림" toastOptions={{ unstyled: true, closeButtonAriaLabel: "알림 닫기", classNames: {
      toast: "flex w-full items-center gap-3 rounded-lg bg-black-100 px-4 py-3 text-white shadow-modal",
      title: "text-sm leading-160", description: "text-xs leading-160 text-white/80", content: "flex min-w-0 flex-1 flex-col gap-1",
      actionButton: "shrink-0 cursor-pointer rounded border border-white/30 bg-transparent px-3 py-2 text-xs leading-150 text-white",
    } }}
    style={{ "--width": "min(var(--container-content), calc(100vw - 30px))", fontFamily: "var(--font-number-glyphs), var(--font-body), system-ui, sans-serif", fontWeight: "var(--font-body-weight)", "--normal-bg": "var(--color-white)", "--normal-text": "var(--color-black-100)", "--normal-border": "var(--color-black-010)" } as CSSProperties}
    icons={{ success: <IconContainer><Check /></IconContainer>, info: <IconContainer><Info /></IconContainer>, warning: <IconContainer><TriangleAlert /></IconContainer>, error: <IconContainer><TriangleAlert /></IconContainer>, loading: <IconContainer className="animate-spin"><LoaderCircle /></IconContainer>, close: <IconContainer size="sm"><X /></IconContainer> }} />;
}

export { toast };
