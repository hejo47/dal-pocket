"use client";

import type { ComponentProps } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";

import { IconContainer } from "@/components/ui/icon-container";

import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root className={cn("flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border border-black-030 bg-white text-black-100 disabled:opacity-40", className)} {...props}>
    <CheckboxPrimitive.Indicator><IconContainer><Check /></IconContainer></CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>;
}
