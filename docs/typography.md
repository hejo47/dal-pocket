# 달주머니 서체

사용자가 선택한 기본 서체는 **차이 상승체**입니다. 본문·숫자·메인 제목은 각각 CSS 변수로 관리하며 `/typography`에서 Y 너만을 비춤체와 비교해 변경할 수 있습니다. Paperlogy는 불러오지 않습니다. 브랜드 표기는 별도의 Pretendard를 사용합니다.

## 역할과 굵기

| 역할 | 변수 | CSS 요청 굵기 |
| --- | --- | --- |
| 본문·폼·버튼 | `--font-body`, `--font-body-weight` | 500 |
| 모든 크기의 숫자 | `--font-number`, `--font-number-weight`, `--font-number-glyphs` | 500 |
| 메인 타이틀·모달 제목 | `--font-title`, `--font-title-weight` | 700 |
| 작은 제목 | `--font-heading-weight` | 600 |

상승체 공식 TTF ZIP과 현재 WOFF2 배포 파일에는 **Light 300 / Extra Bold 800**만 있습니다. 실제 500·600·700 파일이나 가변 축은 없습니다. 요청값 500은 300 파일, 600·700은 800 파일로 매칭됩니다. `font-synthesis: none`을 사용하며 정적 파일을 가변 폰트로 잘못 선언하지 않습니다. 중간 굵기의 정밀 조절에는 해당 굵기의 원본이 필요합니다.

## 구현

- `src/styles/fonts.css`: 원본 파일과 역할별 변수.
- `src/app/globals.css`: `font-body`, `font-numbers`, `font-point` 유틸리티.
- `src/app/layout.tsx`: CSS를 한 번 불러오는 진입점.
- `src/components/providers/pocket-provider.tsx`: 저장된 역할별 선택을 변수에 적용.
- 숫자 전용 `unicode-range` 별칭을 본문·제목 스택 앞에 두어 작은 날짜와 큰 금액 모두 같은 선택을 따릅니다.
- 이전 미선택·Pretendard 비교 설정은 지출과 예산을 보존하면서 상승체 기본값으로 옮깁니다.

## 파일 전달과 출처

웹폰트는 `public/fonts`에 원본 그대로 저장해 앱과 함께 제공합니다. 외부 CDN에 실행 중 의존하지 않으며 `font-display: swap`을 사용합니다. 서체 파일의 변형·보간은 하지 않습니다. 각 라이선스는 같은 폴더에 있습니다.

- [차이 공식 배포 페이지](https://www.artistchai.co.kr/#/pride/identity_font)
- [확인한 공식 TTF ZIP](https://www.artistchai.co.kr/font/TTF.zip)
- [웹폰트 배포](https://noonnu.cc/font_page/1977)
- [Y 공식 배포 페이지](https://www.yspotlight.co.kr/download/font)
- [Pretendard 공식 저장소](https://github.com/orioncactus/pretendard)

확인일: 2026-11-02.