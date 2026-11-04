<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## 달주머니 UI 작업 원칙

- 반복되는 버튼, 입력, 금액·데이터 표시는 기존 공통 컴포넌트를 재사용한다. 새 패턴이면 공통 컴포넌트로 만든 뒤 같은 역할의 화면과 상태에 함께 적용한다.
- 날짜와 월을 고르는 모든 조회·등록 UI는 공통 날짜 선택 컴포넌트를 사용한다. 브라우저 기본 date/month 입력을 별도로 남기지 않는다.
- 수정 후 해당 컴포넌트의 사용처를 확인한다. 푸시 전에는 사용자에게 먼저 확인한다.
