import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { IconContainer } from "@/components/ui/icon-container";

export function IconButton({ label, children, ...props }: { label: string } & ComponentProps<"button">) {
  return <Button {...props} variant="ghost" size="icon" aria-label={label} title={label}>
    <IconContainer size="slg">{children}</IconContainer>
  </Button>;
}
