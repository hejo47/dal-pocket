import type { ComponentProps } from "react";
import { Trash2, CalendarX2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export function RecordRemoveButton({ label, planned = false, ...props }: {
  label: string; planned?: boolean;
} & Omit<ComponentProps<"button">, "children" | "className">) {
  return <IconButton {...props} type="button" className="shrink-0" label={label}>
    {planned ? <CalendarX2 /> : <Trash2 />}
  </IconButton>;
}
