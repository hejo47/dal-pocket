import type { ReactNode } from "react";

import { PillButton } from "@/components/ui/pill-button";

type ActionButton = { label: ReactNode; id?: string; variant?: "filled" | "outline"; disabled?: boolean; onClick?: () => void; type?: "button" | "submit"; form?: string };
export function ActionButtonRow({ buttons }: { buttons: ActionButton[] }) {
  return <div className="flex w-full gap-2">{buttons.map(({ label, ...button }, index) => <PillButton key={button.id ?? index} {...button} className="flex-1">{label}</PillButton>)}</div>;
}
