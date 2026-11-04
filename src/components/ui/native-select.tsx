import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";

import { IconContainer } from "@/components/ui/icon-container";

import { cn } from "@/lib/utils";

export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return <div className="relative flex w-full min-w-0 items-center">
    <select className={cn("w-full min-w-0 appearance-none rounded-lg border border-black-010 bg-white py-3 pr-11 pl-3 text-base leading-150 text-black-100 disabled:opacity-50", className)} {...props}>{children}</select>
    <IconContainer className="pointer-events-none absolute top-1/2 right-select-arrow -translate-y-1/2 text-black-030"><ChevronDown /></IconContainer>
  </div>;
}
export function NativeSelectOption(props: ComponentProps<"option">) { return <option className="bg-white text-black-100" {...props} />; }
