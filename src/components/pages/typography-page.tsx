"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Check } from "lucide-react";

import { usePocket } from "@/components/providers/pocket-provider";
import { ActionButtonRow } from "@/components/ui/action-button-row";
import { FieldHint } from "@/components/ui/form-field";
import { IconContainer } from "@/components/ui/icon-container";
import { PillButton } from "@/components/ui/pill-button";
import { PageSkeleton, ScreenTitle } from "@/components/ui/screen-title";

import { FONT_NAMES } from "@/lib/pocket";
import type { FontChoice } from "@/lib/pocket";
import { cn } from "@/lib/utils";

const fonts: FontChoice[] = ["spotlight", "chai"];
const previewClasses = { spotlight: "font-preview-spotlight", chai: "font-preview-chai" };

function FontGroup({ variant, selected, onSelect }: { variant: "body" | "numbers" | "title"; selected: FontChoice | null; onSelect: (font: FontChoice) => void }) {
  const title = { body: "본문 서체", numbers: "숫자 서체", title: "메인 타이틀 서체" }[variant];
  const description = { body: "본문·버튼·소비 내용을 같은 문장으로 비교하세요.", numbers: "큰 잔액과 작은 금액·날짜를 한 서체로 통일합니다.", title: "각 화면의 큰 제목에 사용할 서체를 선택하세요." }[variant];
  return <fieldset className="flex min-w-0 flex-col gap-4"><legend className="sr-only">{title} 선택</legend><div className="flex flex-col gap-1"><h2 className="text-base leading-150">{title}</h2><p className="text-xs leading-160 text-black-030">{description}</p></div><div className="flex flex-col gap-3 sm:flex-row">{fonts.map((font) => <div key={font} className={cn("flex min-w-0 flex-1 flex-col gap-4 rounded-lg border p-4", selected === font ? "border-black-100 bg-black-002" : "border-black-010 bg-white")}><h3 className="text-sm leading-150">{FONT_NAMES[font]}</h3><div className={cn("flex flex-1 flex-col gap-4", variant === "title" && font === "chai" ? "font-preview-chai-title" : previewClasses[font])}>
    {variant === "body" && <><p className="text-base leading-160">이번 주 지출을 확인하고 남은 예산을 관리하세요.</p><div className="flex flex-col gap-1 border-t border-black-010 pt-4"><p className="text-sm leading-140">친구와 점심</p><p className="text-xs leading-150 text-black-030">식비 · 오늘 기록한 소비</p></div><p className="text-xs leading-160 text-black-030">작은 안내 문구도 편하게 읽히는지 비교해보세요.</p></>}
    {variant === "numbers" && <><p className="text-3xl leading-130">36,000<span className="text-base">원</span></p><p className="text-base leading-150">−9,000원</p><p className="text-sm leading-150">1,234,567 · 42%</p><p className="text-xs leading-150">2026. 11. 15. / 0123456789</p></>}
    {variant === "title" && <><p className="text-2xl leading-140">이번 주 예산</p><p className="text-xl leading-140">지출 내역</p><p className="text-xl leading-140">지출 분석</p></>}
    </div><PillButton variant={selected === font ? "filled" : "outline"} size="sm" aria-pressed={selected === font} onClick={() => onSelect(font)}>{selected === font && <IconContainer size="sm"><Check /></IconContainer>}이 서체로 선택</PillButton></div>)}</div></fieldset>;
}

function FontChooser() {
  const pocket = usePocket();
  const [body, setBody] = useState<FontChoice | null>(pocket.data.fonts.chosen ? pocket.data.fonts.body : null);
  const [numbers, setNumbers] = useState<FontChoice | null>(pocket.data.fonts.chosen ? pocket.data.fonts.numbers : null);
  const [title, setTitle] = useState<FontChoice | null>(pocket.data.fonts.chosen ? pocket.data.fonts.title : null);
  function submit(event: FormEvent) { event.preventDefault(); if (body && numbers && title) pocket.saveFonts({ body, numbers, title, chosen: true }); }
  return <form onSubmit={submit} className="flex flex-col gap-8"><FontGroup variant="body" selected={body} onSelect={setBody} /><FontGroup variant="numbers" selected={numbers} onSelect={setNumbers} /><FontGroup variant="title" selected={title} onSelect={setTitle} /><div className="flex flex-col gap-3 rounded-lg bg-black-002 p-4"><p className="text-sm leading-160">본문: {body ? FONT_NAMES[body] : "선택해주세요"}<br />숫자: {numbers ? FONT_NAMES[numbers] : "선택해주세요"}<br />메인 타이틀: {title ? FONT_NAMES[title] : "선택해주세요"}</p><FieldHint>세 항목을 고른 뒤 적용하면 앱 전체에 반영됩니다.</FieldHint></div><ActionButtonRow buttons={[{ label: "선택한 서체 적용", type: "submit", disabled: !body || !numbers || !title }]} /></form>;
}

export function TypographyPage() {
  const pocket = usePocket();
  if (!pocket.ready) return <PageSkeleton />;
  return <div className="flex w-full max-w-content flex-col gap-7"><ScreenTitle title="서체 비교" subtitle="Y 너만을 비춤체 · 차이 상승체" /><FontChooser key={`${pocket.data.fonts.chosen}-${pocket.data.fonts.body}-${pocket.data.fonts.numbers}-${pocket.data.fonts.title}`} /></div>;
}
