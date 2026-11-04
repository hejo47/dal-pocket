import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("box-border block w-full min-w-0 max-w-full rounded-xl border border-black-010 bg-white px-3 py-3 text-base leading-150 text-black-100 placeholder:text-black-020 disabled:bg-black-002 disabled:opacity-50", className)} {...props} />;
}
