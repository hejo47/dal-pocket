"use client";

import type { ComponentProps } from "react";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn("flex items-center gap-2 text-sm leading-150 text-black-030", className)} {...props} />;
}
