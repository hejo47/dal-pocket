import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  if (props.type === "date" || props.type === "month") {
    return <div className={cn("box-border flex w-full min-w-0 max-w-full items-center rounded-xl border border-black-010 bg-white px-3 py-3 text-base leading-150 text-black-100 focus-within:outline-2 focus-within:outline-offset-2", props.disabled && "bg-black-002 opacity-50", className)}>
      <input {...props} className="block w-full min-w-0 max-w-full border-0 bg-transparent p-0 text-base leading-150 text-black-100 outline-none disabled:opacity-50" />
    </div>;
  }
  return <input className={cn("box-border block w-full min-w-0 max-w-full rounded-xl border border-black-010 bg-white px-3 py-3 text-base leading-150 text-black-100 placeholder:text-black-020 disabled:bg-black-002 disabled:opacity-50", className)} {...props} />;
}
