"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

function SortableRow({ id, action }: { id: string; action: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.25 : 1 }} className="flex min-w-0 items-center gap-1 border-b border-black-010 py-1 last:border-0">
    <Button ref={setActivatorNodeRef} {...attributes} {...listeners} variant="ghost" className="min-w-0 flex-1 touch-manipulation cursor-grab justify-start px-2 text-left font-normal select-none active:cursor-grabbing" aria-label={`${id} 순서 변경`}>
      <GripVertical aria-hidden="true" size={18} className="shrink-0 text-black-030" /><span className="min-w-0 break-words">{id}</span>
    </Button>{action}
  </li>;
}

export function SortableList({ items, label, onMove, renderAction }: { items: string[]; label: string; onMove: (active: string, over: string) => void; renderAction: (id: string) => ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return <DndContext sensors={sensors} collisionDetection={closestCenter}
    accessibility={{
      screenReaderInstructions: { draggable: "스페이스나 엔터로 항목을 잡고 위아래 방향키로 이동한 뒤 다시 눌러 저장하세요. 취소는 Esc 키입니다." },
      announcements: {
        onDragStart: ({ active }) => `${active.id} 순서 변경 시작.`,
        onDragOver: ({ active, over }) => over ? `${active.id}, ${items.indexOf(String(over.id)) + 1}번째 위치.` : `${active.id}, 목록 안으로 이동해주세요.`,
        onDragEnd: ({ active, over }) => over ? `${active.id}, ${items.indexOf(String(over.id)) + 1}번째로 이동.` : "순서 변경을 취소했습니다.",
        onDragCancel: () => "순서 변경을 취소했습니다.",
      },
    }}
    onDragStart={({ active }) => setActiveId(String(active.id))}
    onDragCancel={() => setActiveId(null)}
    onDragEnd={({ active, over }) => {
      setActiveId(null);
      if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
    }}>
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <ul aria-label={label} className="flex flex-col">{items.map((id) => <SortableRow key={id} id={id} action={renderAction(id)} />)}</ul>
    </SortableContext>
    {activeId && createPortal(<DragOverlay dropAnimation={null} zIndex={100}>
      <div aria-hidden="true" className="pointer-events-none flex items-center gap-2 rounded-xl border border-black-010 bg-white px-2 py-3 text-sm shadow-sm"><GripVertical size={18} className="text-black-030" /><span>{activeId}</span></div>
    </DragOverlay>, document.body)}
  </DndContext>;
}
