// 규칙 → 예시 → 금지 예시 순서
// 산문형 설명 문단 (규칙인지 참고사항인지 구분이 안 됨)
// "가급적", "되도록" 같은 모호한 표현 → "~한다 / ~하지 않는다"로
// 헤딩은 잘게, 실제 파일 경로를 박아둔다

## TailWind 클래스
- `*-[]`를 사용하는 것을 지양하고 4단위로 나뉘는 숫자는 `*/4`하여 사용할 것.

## 버튼
- 높이를 직접 정하는 `h-*`는 사용하지 말고 Y축 패딩 `py-*`를 사용할 것.

## 색상
- 색상값을 직접 쓰지 않고 `src/app/globals.css`에 정의된 토큰 클래스만 사용할 것.
- 사용 가능한 토큰: `black-100/030/020/010/005/002`, `navy-100`, `gold-1~5`, `red-2`.
- 토큰에 없는 색이 필요하면 임의로 만들지 말고 `globals.css`에 먼저 추가할 것.

```tsx
// ✅
<p className="text-black-020">보조 설명</p>
<div className="border border-black-010 bg-gold-5" />

// ❌
<p className="text-[#919191]">보조 설명</p>
<div className="border-gray-300 bg-amber-50" />
```

## 폰트
- `body` 기본 폰트는 Paperlogy. 본문·폼·안내문 등 Pretendard가 필요한 곳에만 `font-pretendard`를 붙일 것.
- `font-pretendard`를 쓸 때는 자간 `tracking-pt`를 함께 붙일 것. (Pretendard 자간 -2%)
- 행간은 `leading-130/140/150/160/180` 토큰을 사용하고 `leading-[1.6]`처럼 쓰지 않을 것.
- 해당하는 토큰이 없을 경우 `globals.css`에 먼저 추가할 것.

```tsx
// ✅
<p className="font-pretendard text-sm leading-160 tracking-pt text-black-020">안내 문구</p>

// ❌
<p className="text-sm leading-[1.6] tracking-[-0.02em]">안내 문구</p>
```

## 레이아웃
- 레이아웃은 기본적으로 `flex`로 구성할 것. 표·격자 배치처럼 필요한 곳에는 `grid`를, 텍스트 흐름 안에 들어가는 요소에는 `inline-block`을 사용해도 된다.
- `flex` 컨테이너의 간격은 `gap-*`으로 줄 것. 자식마다 `mt-*`/`mb-*`를 붙이지 않을 것.
- `absolute`는 문서 흐름에서 띄워야 하는 엘리먼트(모달, 드롭다운, 인풋 안 아이콘, 배지)에만 사용할 것. 그 외에는 쓰지 않는다.
  - 단순 배치·정렬에 쓰지 않는다. → `flex`/`grid` + `gap`
  - 배경 이미지를 깔 때 쓰지 않는다. → 섹션에 `bg-[url(/images/bg.png)] bg-cover bg-center`
  - 이미지를 자르거나 위치를 맞출 때 쓰지 않는다. → 디자인대로 잘린 이미지를 받아 `Image`로 그대로 넣는다.
  - 요소를 겹칠 때 쓰지 않는다. → `grid` + 겹칠 자식에 `col-start-1 row-start-1`
  - 오버레이(어두운 막)를 씌울 때 쓰지 않는다. → 배경에 `linear-gradient`를 겹친다.
- 쓸데없이 `relative`를 붙이지 않는다. `absolute` 자식이 있을 때만 붙인다.
- 위치 보정용 음수 마진(`-mt-*`, `-ml-*`, `-mx-*` 등)을 쓰지 않는다.
- 배경 크기·위치를 px로 지정하지 않는다(`bg-[length:2567px_auto]`, `bg-[position:-36px_-90px]` 금지). `bg-cover`/`bg-center` 등 키워드만 쓴다.
- 페이지 최대 폭은 `max-w-page`, 본문 폭은 `max-w-content`를 사용할 것. `max-w-[500px]`처럼 쓰지 않을 것.
- `src/app/**/page.tsx`는 라우팅·데이터 조회만 담당하고, 마크업은 `src/components/pages/`의 컴포넌트에 작성할 것.
- `page.tsx`의 래퍼는 아래 형태를 유지할 것.

```tsx
// ✅ src/app/wreath/[id]/page.tsx
const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const data = getObituaryViewData(id);

  return (
    <div className="w-full max-w-page mx-auto flex flex-col flex-1 items-center justify-start">
      {data ? <WreathList obituaryId={id} data={data} /> : <ComingSoon title="근조화환 보내기" />}
    </div>
  );
};
```

```tsx
// ✅ 배치는 flex + gap
<div className="flex flex-col gap-4">
  <FieldLabel>보내는 분</FieldLabel>
  <TextField value={sender} onChange={handleChange} />
</div>

// ✅ absolute — 인풋 안에 띄우는 아이콘
<div className="relative w-full">
  <input className="w-full pr-10" />
  <IconContainer size="slg" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
    <CalendarIcon />
  </IconContainer>
</div>

// ❌ 단순 배치를 absolute로
<div className="relative h-20">
  <p className="absolute left-0 top-0">이름</p>
  <p className="absolute left-0 top-6">연락처</p>
</div>

// ✅ 배경 이미지 + 오버레이
<section className="bg-[linear-gradient(rgb(0_0_0/0.2),rgb(0_0_0/0.2)),url(/images/hero/bg.png)] bg-cover bg-center">

// ❌ 배경 이미지를 absolute로
<section className="relative overflow-hidden">
  <div className="absolute left-1/2 -top-112.5 -ml-383 h-393.5 w-702">
    <Image src="/images/hero/bg.png" alt="" fill />
    <div className="absolute inset-0 bg-black/20" />
  </div>
</section>

// ✅ 요소 겹치기 — grid 한 칸에 쌓기
<div className="grid">
  <span className="col-start-1 row-start-1 w-1 justify-self-center bg-white" />
  <span className="col-start-1 row-start-1 mt-1.5 h-1 self-start bg-white" />
</div>

// ❌ 이미지 크롭을 absolute/음수 마진으로
<div className="relative h-88 overflow-hidden">
  <div className="absolute -top-15.25 -left-6.25 h-111.5 w-206">
    <Image src="/images/mass.png" alt="" fill className="object-cover" />
  </div>
</div>
```

## 간격 그룹핑
- 간격이 서로 다른 요소를 한 `flex` 컨테이너에 나란히 두고 `gap` 하나로 처리하지 않을 것.
- 라벨 + 인풋 여러 개처럼 묶음이 생기면, 같은 간격을 쓰는 요소끼리 `div`로 묶고 그 `div`에 `gap`을 줄 것.
- 바깥 컨테이너의 `gap`은 그룹과 그룹 사이 간격만 담당할 것.

```tsx
// ✅ 라벨-인풋 간격과 인풋-인풋 간격을 분리
<div className="flex flex-col gap-2">
  <FieldLabel required>연락처</FieldLabel>
  <div className="flex flex-col gap-3">
    <TextField value={phone} onChange={handlePhone} placeholder="연락처 입력" />
    <TextField value={subPhone} onChange={handleSubPhone} placeholder="추가 연락처 입력" />
  </div>
</div>

// ❌ 라벨과 인풋이 같은 gap을 공유해 간격이 전부 같아짐
<div className="flex flex-col gap-3">
  <FieldLabel required>연락처</FieldLabel>
  <TextField value={phone} onChange={handlePhone} />
  <TextField value={subPhone} onChange={handleSubPhone} />
</div>
```

## 링크와 버튼
- 페이지 이동은 `next/link`의 `Link`로 만들 것. `<button onClick={() => router.push(...)}>`를 사용하지 않을 것.
- `<button>`은 이동이 아닌 동작(제출, 모달 열기, 상태 변경)에만 사용할 것.
- `router.push`는 동작이 끝난 뒤 이동해야 할 때(로그인 성공 후 이동 등)에만 사용할 것.
- 이동과 동작을 모두 지원해야 하는 공용 컴포넌트는 `href`/`onClick`을 배타적 union으로 받을 것. (`src/components/ui/pill-button.tsx` 참고)

```tsx
// ✅ 이동
<Link href="/signup" className="cursor-pointer">회원가입</Link>

// ✅ 동작 후 이동
const handleLogin = async () => {
  await login(email, password);
  router.push("/");
};

// ❌ 단순 이동을 button + router.push로
<button type="button" onClick={() => router.push("/signup")} className="cursor-pointer">
  회원가입
</button>
```

## 하단 고정 버튼
- 페이지 하단 고정 버튼은 `ActionButtonRow`(`src/components/ui/action-button-row.tsx`)만 사용할 것. `<button>`을 직접 만들지 않을 것.
- 고정 래퍼 클래스는 아래를 그대로 사용할 것.
- 버튼이 가리는 만큼 본문 하단에 여백을 줄 것.

```tsx
// ✅
<div className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-page gap-2 bg-white px-6 pt-4 pb-10">
  <ActionButtonRow
    buttons={[
      { label: "작성 취소", variant: "outline", onClick: () => setCancelOpen(true) },
      { label: "조의금 등록", variant: "filled", disabled: !canSubmit, onClick: handleSubmit },
    ]}
  />
</div>

// ❌
<div className="fixed bottom-0 flex gap-2">
  <button className="h-12 rounded-full bg-[#654D27] text-white">조의금 등록</button>
</div>
```

## 아이콘
- 아이콘은 `src/components/icons/`의 컴포넌트와 `lucide-react`를 혼용한다. 프로젝트 전용 아이콘은 `icons/`, 범용 아이콘(`X`, `ChevronDown` 등)은 `lucide-react`를 사용할 것.
- `src/components/icons/`에 이미 있는 아이콘을 `lucide-react`로 대체하지 않을 것.
- 아이콘은 항상 `IconContainer`로 감싸고 크기는 `size` prop(`sm`/`ssm`/`default`/`slg`/`lg`/`xl`)으로 지정할 것. `w-*`/`h-*`를 직접 붙이지 않을 것.
- 아이콘 색은 `currentColor` 기준이므로 `IconContainer`에 `text-*`를 줄 것.

```tsx
// ✅
<IconContainer size="lg" className="text-black-030">
  <ArrowRightIcon />
</IconContainer>

// ❌
<ArrowRightIcon className="h-5 w-5 fill-[#535353]" />
```

## 폼
- 입력 요소는 `src/components/ui/form-field.tsx`의 `TextField` / `SelectField` / `DateField` / `Checkbox`를 사용할 것. `<input>`을 직접 쓰지 않을 것.
- 라벨은 `FieldLabel`, 필수 표시는 `required` prop으로 처리할 것. `*`를 직접 찍지 않을 것.
- 에러는 `FieldError`, 안내 문구는 `FieldHint`를 사용할 것.

```tsx
// ✅
<FieldLabel required>보내는 분</FieldLabel>
<TextField value={sender} onChange={(e) => setSender(e.target.value)} placeholder="이름 입력" />
<FieldHint>주문 후에는 변경할 수 없습니다.</FieldHint>
```

## 조건부 클래스
- 클래스 조합·조건부 분기는 `cn`(`@/lib/utils`)을 사용할 것. 템플릿 문자열로 이어붙이지 않을 것.

```tsx
// ✅
className={cn("rounded-full px-5 py-2.5", active ? "bg-gold-1 text-white" : "bg-black-002 text-black-020")}

// ❌
className={`rounded-full px-5 py-2.5 ${active ? "bg-gold-1" : ""}`}
```

## import 순서
- 아래 순서로 그룹을 나누고 그룹 사이에 빈 줄을 넣을 것.
  1. `react` / `next` / 외부 패키지
  2. `@/components/icons`
  3. `@/components/pages`
  4. `@/components/ui`
  5. `@/lib`
- 타입만 가져올 때는 `import type`을 사용할 것.

## 이미지
- 모든 이미지(사진, SVG 아이콘, 로고)는 `next/image`의 `Image`를 사용할 것. `<img>`를 쓰지 않는다.
  - SVG는 `src`가 `.svg`로 끝나면 Next가 자동으로 최적화 없이(`unoptimized`) 내보낸다.
  - 예외: `blob:`/`data:` URL(업로드 미리보기 등)만 `<img>`를 쓴다.
- `width`/`height`에는 **1920 디자인(Figma)에서 화면에 보이는 크기**를 넣는다. 파일 원본 크기를 넣지 않는다.
- 이미지 파일은 디자인대로 잘라서 **보이는 크기의 2배**로 내보낸다. (예: 812×440 영역 → 1624×880 파일)
- CSS로 이미지 크기(`w-*`, `h-*`, `object-*`)를 주지 않는다. 화면이 좁아지면 기본 스타일(`max-width: 100%; height: auto`)로 비율대로 줄어든다.
  - 예외: 모바일 디자인 크기가 PC 비율과 다를 때만 `max-xl:w-*`로 지정한다.
- 이미지마다 크롭 위치·크기 값을 따로 두지 않는다. 데이터에는 경로만 둔다.
- 화면 최상단에 바로 보이는 이미지에는 `preload`를 붙일 것(Next 16에서 `priority`는 deprecated). 그 외에는 붙이지 않을 것.
- 외부 도메인 이미지는 `next.config.ts`의 `images.remotePatterns`에 도메인을 먼저 등록할 것.

```tsx
// ✅ 사진 — 디자인 크기만 지정
<Image src="/images/service-1.png" alt="" width={812} height={440} className="rounded-xl" />

// ✅ 아이콘·로고 — SVG도 Image
<Image src="/icons/menu.svg" alt="" width={18} height={12.5217} />

// ✅ 데이터에는 경로만
const SPACES = [{ label: "로비", images: ["/images/lobby-1.png", "/images/lobby-2.png"] }];

// ❌ img 사용
<img src="/images/service-1.png" alt="" />

// ❌ 파일 원본 크기 + CSS로 크기 재지정
<Image src="/images/service-1.png" alt="" width={1624} height={880} className="h-111.5 w-full object-cover" />

// ❌ 이미지마다 크롭 값
{ src: "/images/lobby-1.png", crop: "-top-13 -left-2.5 h-146 w-218.5" }
```

## 자주 나오는 실수
- 디자인 가이드의 px 값을 `*-[16px]`로 그대로 옮기지 말 것. → `*-4`
- 새 버튼·입력·모달을 페이지 파일 안에서 즉석으로 만들지 말 것. → `src/components/ui/` 확인 후 재사용
- 없을 경우 `shadcn` 사용해 제작
- `text-gray-*`, `text-red-500` 등 Tailwind 기본 팔레트를 쓰지 말 것. → 프로젝트 토큰만 사용
- 상태를 가진 컴포넌트에 `"use client"` 누락하지 말 것.