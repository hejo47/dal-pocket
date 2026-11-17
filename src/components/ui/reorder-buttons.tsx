import { ArrowUp, ArrowDown } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export function ReorderButtons({ label, first, last, onMove }: { label: string; first: boolean; last: boolean; onMove: (direction: -1 | 1) => void }) {
  return <div role="group" aria-label={`${label} 순서 변경`} className="flex shrink-0 items-center">
    <IconButton label={`${label} 위로 이동`} disabled={first} onClick={() => onMove(-1)}><ArrowUp /></IconButton>
    <IconButton label={`${label} 아래로 이동`} disabled={last} onClick={() => onMove(1)}><ArrowDown /></IconButton>
  </div>;
}
