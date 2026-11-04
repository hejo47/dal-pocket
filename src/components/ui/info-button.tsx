import type { ComponentProps } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconContainer } from "@/components/ui/icon-container";

export function InfoButton({ label, ...props }: { label: string } & ComponentProps<"button">) {
  return <Button {...props} type="button" variant="ghost" size="icon" className="shrink-0 px-1 py-1 text-black-030" aria-label={label} title={label}>
    <IconContainer size="sm"><Info /></IconContainer>
  </Button>;
}
