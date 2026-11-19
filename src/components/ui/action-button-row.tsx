import type { ReactNode } from "react";

import { PillButton } from "@/components/ui/pill-button";

type ActionButton = { label: ReactNode; icon?: ReactNode; id?: string; variant?: "filled" | "outline"; disabled?: boolean; onClick?: () => void; type?: "button" | "submit"; form?: string };
export function ActionButtonRow({ buttons }: { buttons: ActionButton[] }) {
  return <div className="flex w-full gap-2">{buttons.map(({ label, icon, ...button }, index) => <PillButton key={button.id ?? index} {...button} size={icon ? "icon" : "default"} className={icon ? "size-12 shrink-0 p-0" : "flex-1"}>{icon ? <><span aria-hidden="true">{icon}</span><span className="sr-only">{label}</span></> : label}</PillButton>)}</div>;
}
