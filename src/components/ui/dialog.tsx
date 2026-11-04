"use client";

import type { ComponentProps } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconContainer } from "@/components/ui/icon-container";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({ children, className, size = "default", placement = "center", ...props }: ComponentProps<typeof DialogPrimitive.Content> & {
  size?: "default" | "compact";
  placement?: "center" | "bottom";
}) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black-100/45" />
    <div className={cn("pointer-events-none fixed inset-0 z-50 flex justify-center p-modal-gutter", placement === "bottom" ? "items-end" : "items-center")}>
      <DialogPrimitive.Content {...props} className={cn("pocket-dialog pointer-events-auto relative flex max-h-dialog w-full min-w-0 flex-col gap-5 overflow-hidden rounded-xl border border-black-010 bg-white p-5 text-black-100 shadow-modal", size === "compact" ? "max-w-sm" : "max-w-modal", className)}>
        {children}
        <DialogClose asChild><Button data-dialog-close variant="ghost" size="icon" className="absolute top-3 right-3" aria-label="닫기"><IconContainer size="slg"><X /></IconContainer></Button></DialogClose>
      </DialogPrimitive.Content>
    </div>
  </DialogPrimitive.Portal>;
}
function DialogHeader({ className, ...props }: ComponentProps<"div">) { return <div className={cn("flex shrink-0 flex-col gap-2 pr-12", className)} {...props} />; }
function DialogFooter({ className, ...props }: ComponentProps<"div">) { return <div className={cn("flex shrink-0 gap-2 border-t border-black-010 pt-4", className)} {...props} />; }
function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title className={cn("font-point text-xl leading-140", className)} {...props} />; }
function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description className={cn("text-xs leading-160 text-black-030", className)} {...props} />; }

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
