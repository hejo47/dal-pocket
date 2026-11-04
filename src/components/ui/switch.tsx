"use client";

import type { ComponentProps } from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return <SwitchPrimitive.Root
    className={cn("inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-black-020 p-0.5 transition-colors data-[state=checked]:bg-black-100 disabled:opacity-40", className)}
    {...props}
  >
    <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-white transition-transform data-[state=checked]:translate-x-4" />
  </SwitchPrimitive.Root>;
}
