# 달주머니

주간·월간 예산을 설정하고 지출을 기록하는 개인용 Next.js 앱입니다.

## 실행

Node.js 24를 사용합니다.

```sh
npm ci
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다. DB 설정 없이도 예시 화면과 브라우저 저장 기능을 사용할 수 있습니다. 첫 예산을 저장하거나 지출을 추가하거나 ‘내 기록 시작’을 누르면 예시 내역을 비우고 개인 기록을 시작합니다.

## 화면과 기능

| 경로 | 기능 |
| --- | --- |
| `/` | 남은 예산, 사용 금액, 하루 사용 가능액, 오늘 지출 |
| `/expenses` | 날짜별 내역, 카테고리 필터, 지출 수정·삭제·삭제 되돌리기 |
| `/analysis` | 카테고리별 합계·비율, 하루 평균, 이전 기간 비교 |
| `/budget` | 주간·월간 예산 각각 저장, 주 시작 요일 선택 |
| `/typography` | 본문·숫자·제목 서체를 따로 비교하고 변경 |

숫자는 크기와 관계없이 선택한 한 글꼴을 사용합니다. 현재 기본 서체는 차이 상승체이며 CSS 굵기는 본문·숫자 500, 작은 제목 600, 메인 제목 700입니다. 실제 상승체 파일은 300·800 두 종류라 브라우저가 가까운 굵기를 선택합니다. 자세한 내용은 [서체 설정](docs/typography.md)을 참고하세요.

공용 컴포넌트와 퍼블리싱 구조는 [publishing.md](publishing.md)를 따릅니다. 폰트는 사용자의 후속 선택을 우선 반영했고, 색상은 무채색만 사용합니다.

## Supabase + Prisma

별도 API 서버 없이 Next.js Route Handler와 Prisma ORM 7로 저장합니다.

1. Supabase 프로젝트의 **Connect**에서 Transaction pooler와 Direct connection 또는 Session pooler 주소를 복사합니다.
2. `.env.example`을 `.env`로 복사해 실제 접속 정보를 입력합니다.
3. `npm run db:deploy`로 준비된 마이그레이션을 적용합니다.
4. 개발 서버를 다시 실행합니다.

`DATABASE_URL`은 앱 실행용 pooler, `DIRECT_URL`은 마이그레이션용 연결입니다. 비밀번호의 특수 문자는 URL 인코딩합니다. 이 값들은 브라우저로 전달하지 않습니다. 별도의 Supabase public key나 service role key는 필요하지 않습니다.

`pocket` 전용 스키마에 `Pocket`과 `Expense` 테이블을 만들며 Supabase Data API의 노출 스키마에 추가하지 않습니다. 예시 내역은 서버에 저장하지 않습니다. 접속 정보가 없으면 로컬 저장을 유지하며, 서버 저장 실패·동시 수정 충돌은 화면에 표시합니다.

현재는 로그인 없는 개인용입니다. 임의의 HttpOnly 쿠키로 브라우저별 보관함을 구분합니다. **다른 기기에서 자동으로 같은 기록을 열 수 없으며, 쿠키를 지우면 기존 서버 기록에 다시 접근할 수 없습니다.** 로그인을 추가할 때 이 보관함을 계정과 연결할 수 있습니다.

### API

| 메서드 | 경로 | 동작 |
| --- | --- | --- |
| GET | `/api/pocket` | 이 브라우저의 전체 기록과 변경 버전 조회, 최초 보관함 쿠키 발급 |
| PUT | `/api/pocket` | 예산·설정·지출 전체를 한 트랜잭션으로 저장 |

PUT 본문은 `{ data: PocketData, revision: number }`입니다. 최신 `revision`이 일치할 때만 저장합니다. 오래된 버전은 409로 거부해 다른 탭의 변경을 덮어쓰지 않습니다. 금액·날짜·카테고리·중복 ID와 같은 출처의 JSON 요청인지 확인합니다. 내역은 보관함당 최대 10,000건, 요청은 최대 2MB입니다.

로컬 캐시는 `dal-pocket-v1`, 동기화 상태는 `dal-pocket-sync-v1`에 저장됩니다. 충돌 후 ‘서버 기록 불러오기’를 누르면 기존 로컬 사본은 `dal-pocket-local-backup`에 보관됩니다.

## Vercel과 브랜치

- `main`: Production 배포용
- `dev`: 이후 개발 작업 및 Preview 배포용
- Framework Preset: Next.js, Root Directory: 저장소 루트
- Node.js: 24.x, Install Command: `npm ci`, Build Command: `npm run build`
- Vercel 환경 변수에 `DATABASE_URL`을 등록합니다. 마이그레이션은 `DIRECT_URL`이 설정된 환경에서 `npm run db:deploy`로 별도 실행합니다.
- 설치 후 및 빌드 시 Prisma Client를 생성합니다. 자동 빌드 중 DB 내용을 변경하지 않습니다.

Vercel 프로젝트 생성·Supabase 실제 연결은 계정과 접속 정보를 설정한 뒤 진행합니다. 비밀값은 커밋하지 않습니다.

## 검증

```sh
npm run lint
npm test
npm run db:validate
npm run build
```

API 통합 검증은 별도 로컬 PostgreSQL에 마이그레이션을 적용하고 해당 DB를 사용하는 앱을 실행한 뒤 진행합니다. 테스트는 새 브라우저 보관함만 사용합니다.

```powershell
$env:POCKET_TEST_BASE_URL = 'http://localhost:3001'
npm run test:api
```

Supabase 운영 DB 연결은 실제 접속 정보를 설정한 환경에서 추가로 확인해야 합니다.

## 참고 문서

- [Supabase Prisma 연결](https://supabase.com/docs/guides/database/prisma)
- [Prisma pooler와 마이그레이션 연결 분리](https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections/pgbouncer)
