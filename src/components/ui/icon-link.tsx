import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { IconContainer } from "@/components/ui/icon-container";

export function IconLink({ href, label, children, className }: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return <Button asChild variant="ghost" size="icon" className={className}>
    <Link href={href} aria-label={label} title={label}>
      <IconContainer size="slg">{children}</IconContainer>
    </Link>
  </Button>;
}
