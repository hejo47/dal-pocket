"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { SquarePen, Trash2 } from "lucide-react";

import { usePocket } from "@/components/providers/pocket-provider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FieldLabel, SelectField, TextField } from "@/components/ui/form-field";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";

export function CategoryManager({ onAdded, onDeleted }: {
  onAdded: (name: string) => void;
  onDeleted: (name: string) => void;
}) {
  const pocket = usePocket();
  const categories = pocket.data.categories;
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [replacement, setReplacement] = useState("");
  const affected = deleting ? pocket.data.expenses.filter((expense) => expense.category === deleting).length : 0;

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = name.trim();
    if (!next) return setError("카테고리 이름을 입력해주세요.");
    if (next === "전체" || categories.includes(next)) return setError("이미 있는 카테고리입니다.");
    if (next.length > 10) return setError("카테고리는 10자 이내로 입력해주세요.");
    if (!pocket.addCategory(next)) return setError("카테고리는 최대 30개까지 추가할 수 있습니다.");
    setName("");
    setError("");
    onAdded(next);
  }

  return <Dialog onOpenChange={(open) => {
    if (!open) {
      setName("");
      setError("");
      setDeleting(null);
    }
  }}>
    <DialogTrigger asChild>
      <PillButton type="button" variant="ghost" size="icon" aria-label="카테고리 관리" title="카테고리 관리">
        <IconContainer size="slg"><SquarePen /></IconContainer>
      </PillButton>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{deleting ? "카테고리 삭제" : "카테고리 관리"}</DialogTitle>
        <DialogDescription>{deleting
          ? affected > 0 ? `${deleting} 지출 ${affected}건을 다른 카테고리로 옮긴 뒤 삭제합니다.` : `${deleting} 카테고리를 삭제합니다.`
          : "카테고리를 추가하거나 삭제할 수 있어요."}</DialogDescription>
      </DialogHeader>
      {deleting ? <>
        {affected > 0 && <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="replacement-category" required>기록을 옮길 카테고리</FieldLabel>
          <SelectField id="replacement-category" value={replacement}
            options={categories.filter((item) => item !== deleting).map((item) => ({ value: item, label: item }))}
            onChange={(event) => setReplacement(event.target.value)} />
        </div>}
        <DialogFooter>
          <PillButton variant="outline" onClick={() => setDeleting(null)}>취소</PillButton>
          <PillButton disabled={affected > 0 && !replacement} onClick={() => {
            if (pocket.deleteCategory(deleting, replacement)) {
              onDeleted(deleting);
              setDeleting(null);
            }
          }}>삭제</PillButton>
        </DialogFooter>
      </> : <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
        <form onSubmit={add} className="flex flex-col gap-2">
          <FieldLabel htmlFor="new-category">새 카테고리</FieldLabel>
          <div className="flex items-center gap-2">
            <TextField id="new-category" maxLength={10} placeholder="카테고리 이름" value={name}
              onChange={(event) => { setName(event.target.value); setError(""); }} />
            <PillButton type="submit" size="sm" className="shrink-0" disabled={categories.length >= 30}>추가</PillButton>
          </div>
          {error && <p role="alert" className="text-xs text-red-2">{error}</p>}
        </form>
        <ul className="flex flex-col gap-2">
          {categories.map((item) => <li key={item} className="flex items-center justify-between gap-2 rounded-lg bg-black-002 px-3 py-1">
            <span className="text-sm">{item}</span>
            <PillButton type="button" variant="outline" size="icon" className="px-2 py-2 shadow-none"
              aria-label={`${item} 삭제`} title={`${item} 삭제`} disabled={categories.length <= 1} onClick={() => {
                setDeleting(item);
                setReplacement(categories.find((candidate) => candidate !== item) ?? "");
              }}><IconContainer size="sm"><Trash2 /></IconContainer></PillButton>
          </li>)}
        </ul>
      </div>}
    </DialogContent>
  </Dialog>;
}
