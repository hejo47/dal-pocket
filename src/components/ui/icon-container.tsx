import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const sizes = { sm: "size-3", ssm: "size-3.5", default: "size-4", slg: "size-5", lg: "size-6", xl: "size-8" };
export function IconContainer({ size = "default", className, children, ...props }: ComponentProps<"span"> & { size?: keyof typeof sizes }) {
  return <span aria-hidden="true" className={cn("icon-container inline-flex shrink-0 items-center justify-center", sizes[size], className)} {...props}>{children}</span>;
}
