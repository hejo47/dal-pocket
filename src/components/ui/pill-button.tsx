import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";

type Common = { children: ReactNode; className?: string; variant?: "filled" | "outline" | "ghost" | "soft"; size?: "default" | "sm" | "icon" };
type Action = Common & Omit<ComponentProps<"button">, keyof Common> & { href?: never };
type Navigation = Common & { href: string; onClick?: never; disabled?: never };

export function PillButton(props: Action | Navigation) {
  const { children, variant = "filled", className, size = "default" } = props;
  const buttonVariant = variant === "filled" ? "default" : variant;
  if (props.href !== undefined) return <Button asChild variant={buttonVariant} size={size} className={className}><Link href={props.href}>{children}</Link></Button>;
  return <Button {...props} variant={buttonVariant} size={size} className={className}>{children}</Button>;
}
