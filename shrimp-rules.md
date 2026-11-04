# Development Guidelines

> AI Agent 전용 규칙 문서. 일반 개발 지식은 제외하고 이 프로젝트에만 해당하는 규칙만 기술한다. 응답과 문서는 **한국어**로 작성한다.

## 프로젝트 개요

- 목적: 모임 이벤트 관리 웹 MVP (공지·참석·출석·카풀·정산, 공유 링크 참여). 기준 문서는 `docs/PRD.md`, 일정은 `docs/ROADMAP.md`.
- 스택: Next.js(App Router, `next: latest`, Cache Components) + React 19 + Supabase Auth(`@supabase/ssr`) + Tailwind CSS 3 + shadcn/ui + `next-themes`.
- 현재 상태: 스타터킷(`with-supabase`) 기반. Google OAuth 로그인/콜백만 구현됨. 이벤트 도메인 기능은 ROADMAP Phase 1~4 순서대로 구현한다.

## 프로젝트 구조

- **소스는 `src/`가 아닌 저장소 루트**에 둔다: `app/`, `components/`, `lib/`. `docs/guides/project-structure.md`의 `src/` 구조를 따르지 않는다.
- 경로 별칭은 `@/*` 만 사용한다. 상대 경로(`../`) 대신 별칭을 우선한다.

| 위치                    | 용도                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `app/auth/*`            | 인증 페이지 및 라우트 (`callback`, `confirm`는 Route Handler)      |
| `app/(app)/*`           | 로그인 필요 영역 (`events`, `events/new`, `events/[id]`, `manage`) |
| `app/e/[code]`          | 공개 이벤트 초대 (요약 + 로그인 유도)                              |
| `lib/mocks/*`           | Phase 2 더미 데이터 (Phase 3에서 Supabase 쿼리로 교체)             |
| `components/ui/*`       | shadcn/ui 컴포넌트 (CLI로만 추가)                                  |
| `components/*-form.tsx` | 인증 폼                                                            |
| `lib/supabase/*`        | Supabase 클라이언트 팩토리 (`server.ts`, `client.ts`, `proxy.ts`)  |
| `lib/auth/safe-next.ts` | `next` 리다이렉트 경로 검증                                        |
| `proxy.ts` (루트)       | 세션 갱신 진입점 (Next 16에서 `middleware.ts` 대체)                |
| `docs/guides/*`         | 한국어 컨벤션 문서                                                 |
| `.claude/`              | 에이전트, 커맨드, 훅 (Prettier 제외)                               |
| `shrimp_data/`          | shrimp-task-manager 데이터. **수정 금지**                          |

## 코드 표준

- Prettier 설정 준수: 세미콜론 사용, 큰따옴표(`"`), trailing comma `all`, 80자, 2칸 들여쓰기, LF.
- Tailwind 클래스는 `prettier-plugin-tailwindcss`가 정렬한다. `cn()`, `cva()` 안의 클래스도 정렬 대상이다.
- 클래스 병합은 `lib/utils.ts`의 `cn()`을 사용한다.
- 주석과 사용자 노출 문구는 한국어로 작성한다.
- 커밋 메시지는 `git:commit` 스킬 형식(이모지 + 컨벤셔널 커밋)을 따른다.
- 편집 후 `.claude/hooks/format.mjs`가 Prettier를 자동 실행한다. 포맷을 수동으로 되돌리지 않는다.

## 인증 / 세션 규칙 (다중 파일 연동)

- `proxy.ts` → `lib/supabase/proxy.ts`의 `updateSession` → `supabase.auth.getClaims()` 흐름을 유지한다.
- **금지**: `createServerClient`와 `getClaims()` 사이에 코드 삽입.
- **금지**: `getClaims()` 제거.
- **금지**: Supabase 클라이언트를 모듈 전역 변수에 저장. 요청/함수마다 새로 생성한다.
- 서버 코드는 `await createClient()` (`lib/supabase/server.ts`), 브라우저 코드는 `lib/supabase/client.ts`를 사용한다.
- 비로그인 허용 경로(`/`, `/login*`, `/auth*`, `/e/*`)를 바꾸면 `lib/supabase/proxy.ts`의 조건문과 `CLAUDE.md`의 해당 문구를 **함께** 수정한다.
- `next` 쿼리 파라미터로 리다이렉트할 때는 반드시 `getSafeNext()`를 거친다.
  - 허용: `redirect(getSafeNext(searchParams.get("next")))`
  - 금지: `redirect(searchParams.get("next")!)`
- 에러 메시지를 URL에 넣을 때는 `encodeURIComponent()`를 사용한다 (`/auth/error?error=...`).
- 공유 링크 참여 흐름(비로그인 → 로그인 → 이벤트 초대로 복귀)은 `getSafeNext`의 fallback과 `/auth/callback`의 `next` 전달을 사용한다. 기본 복귀 경로는 `lib/auth/safe-next.ts`의 `DEFAULT_AFTER_LOGIN`(`/events`)이다.

## Next.js 규칙

- `next.config.ts`의 `cacheComponents: true`를 유지한다.
- 동적 데이터 접근(`cookies()`, Supabase 호출 등)은 `<Suspense>` 안에서 수행하거나 Cache Components 규칙에 맞게 처리한다.
  - 허용: 페이지는 정적 셸을 렌더링하고, 데이터를 읽는 컴포넌트를 `<Suspense fallback={...}>`로 감싼다.
  - 금지: `page.tsx`/`layout.tsx` 최상위에서 Suspense 없이 `await cookies()` 또는 Supabase 쿼리 실행.
- 설치된 Next 버전을 확인한 뒤 구현한다. `docs/guides/nextjs-15.md`는 15.5.3 기준이므로 Next 16 동작(`proxy.ts`, Cache Components)과 충돌하면 설치된 버전을 따른다.
- `allowedDevOrigins`의 LAN IP는 개발 환경 값이다. 임의로 삭제하지 않는다.

## 컴포넌트 / 스타일 규칙

- UI 컴포넌트는 shadcn/ui를 사용한다. 새 컴포넌트는 shadcn MCP 또는 `npx shadcn@latest add <name>`으로 `components/ui`에 추가한다. 설정은 `components.json`.
- `components/ui/*`는 직접 재작성하지 않는다. 변형이 필요하면 래퍼 컴포넌트를 만든다.
- 도메인 컴포넌트는 `components/` 하위에 기능별로 둔다. 컴포넌트 패턴·스타일링 규칙은 `docs/guides/component-patterns.md`, `docs/guides/styling-guide.md`를 먼저 읽는다.
- 폼은 `docs/guides/forms-react-hook-form.md` 규칙을 따른다. (`react-hook-form`, `@hookform/resolvers`, `zod`는 설치됨. 스키마는 `lib/validations/*`, 폼 컴포넌트는 `components/event/*-form.tsx`.)
- 다크 모드는 `next-themes`(`components/theme-switcher.tsx`)를 사용한다. 하드코딩 색상 대신 CSS 변수 기반 Tailwind 토큰을 쓴다.
- 모바일 우선으로 구현한다. 사용자는 카톡 공유 링크로 모바일에서 진입한다.

## 기능 구현 규칙

- 구현 전 `docs/PRD.md`(기능 ID F001~F011)와 `docs/ROADMAP.md`의 해당 Task를 읽는다.
- 구현 순서는 ROADMAP을 따른다: Phase 1(골격·타입) → Phase 2(더미 데이터 UI) → Phase 3(Supabase 연동) → Phase 4(다듬기·배포). 선행 Task 없이 후행 Task를 구현하지 않는다.
- 새 테이블 작업 시: 스키마·RLS는 Supabase MCP(`apply_migration`)로 적용하고, 적용 후 `generate_typescript_types`로 타입을 갱신하며, `get_advisors`로 보안 점검을 수행한다. RLS 없는 테이블을 만들지 않는다.
- 스키마를 변경하면 PRD의 데이터 모델 설명과 관련 타입 파일을 **함께** 갱신한다.
- 환경 변수는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`만 사용한다. 서비스 롤 키 등 비밀 값을 클라이언트 코드나 `NEXT_PUBLIC_*`에 두지 않는다. `.env.local`은 커밋하지 않는다.

## 작업 완료 체크리스트 (코드 변경 시 필수)

1. `npm run check-all` (ESLint + `tsc --noEmit` + Prettier 검사)
2. `npm run build` (Cache Components 위반은 빌드에서만 드러날 수 있음)

- 순서대로 실행하고 모두 통과한 뒤에만 완료로 보고한다. 실패하면 수정 후 처음부터 재실행한다.
- 통과하지 못한 항목은 숨기지 말고 결과 그대로 보고한다.
- 문서만 수정한 경우 생략 가능.
- API 연동·비즈니스 로직 Task는 Playwright MCP 시나리오 테스트(정상·예외·경계·회귀)를 통과해야 완료다 (ROADMAP 워크플로우 참조).
- 테스트 러너는 없다. 테스트 러너를 임의로 도입하지 않는다.

## 문서 연동 규칙

| 변경 사항                      | 함께 수정할 파일                                                  |
| ------------------------------ | ----------------------------------------------------------------- |
| Task 완료                      | `docs/ROADMAP.md` (✅ 표시, `docs:update-roadmap` 스킬 사용)      |
| 기능/요구사항 변경             | `docs/PRD.md`, `docs/ROADMAP.md`                                  |
| 명령어·아키텍처·인증 흐름 변경 | `CLAUDE.md`, 이 파일(`shrimp-rules.md`)                           |
| 라우트 추가/삭제               | `docs/PRD.md` 페이지 목록, `lib/supabase/proxy.ts` 허용 경로 검토 |
| 의존성 추가                    | `package.json` + `package-lock.json` (`npm install` 사용)         |
| Husky/lint-staged 규칙 변경    | `.husky/*`, `.lintstagedrc.json`, `CLAUDE.md`                     |

## AI 의사결정 기준

- 새 파일 위치가 모호하면: 라우트 → `app/`, 재사용 UI → `components/`, 서버/공용 로직 → `lib/`. `src/`는 만들지 않는다.
- 클라이언트/서버 선택: 기본은 Server Component. 상태·이벤트 핸들러·브라우저 API가 필요할 때만 `"use client"`.
- 남은 스타터 컴포넌트(`deploy-button`, `hero`, `auth-button`, `env-var-warning`, `next-logo`, `supabase-logo`)는 더 이상 쓰이지 않는 제거 대상이다. 새 기능이 의존하게 만들지 않는다. (`app/protected`, `components/tutorial`은 삭제됨)
- 시각(starts_at 등)은 ISO 8601 + 한국시간(`+09:00`)으로 저장·표시한다. 폼의 `datetime-local` 값은 `lib/datetime.ts`의 `toKstIso()`로 변환한다.
- PRD와 코드가 충돌하면 PRD를 기준으로 하되, 충돌 사실을 보고한다.
- 문서(`docs/guides`)와 설치된 패키지 동작이 충돌하면 설치된 버전을 따르고 context7로 최신 문서를 확인한다.

## 금지 사항

- `src/` 디렉토리 생성.
- `proxy.ts`를 `middleware.ts`로 되돌리기.
- `getClaims()` 제거, `createServerClient`/`getClaims()` 사이 코드 삽입.
- Supabase 클라이언트 전역 캐싱.
- 검증되지 않은 `next` 값으로 리다이렉트.
- RLS 없는 테이블 생성, 비밀 키 노출.
- `shrimp_data/` 수정 또는 커밋 대상 포함.
- `--no-verify`로 Husky 훅 우회.
- `check-all`/`build` 미통과 상태에서 완료 보고.
- `components/ui/*` 직접 대규모 수정.
