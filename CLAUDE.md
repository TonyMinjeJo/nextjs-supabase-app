# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 (`eslint .`) |

- 테스트 러너는 설정되어 있지 않습니다.
- `.env.local`에 아래 두 환경 변수가 필요합니다. (`.env.example`은 커밋되어 있지 않음)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 기술 스택

- Next.js App Router + Supabase Auth (`create-next-app --example with-supabase` 스타터)
- Tailwind CSS 3, shadcn/ui (`components/ui`, 설정: `components.json`), `next-themes`
- 경로 별칭: `@/*`

> **주의:** 소스는 `src/`가 아니라 저장소 루트(`app/`, `components/`, `lib/`)에 있습니다. `docs/guides/project-structure.md`의 `src/` 구조 설명과 다릅니다.

## 아키텍처

### 인증 / 세션 흐름

여러 파일에 걸쳐 동작하므로 함께 봐야 합니다.

1. **`proxy.ts`** (Next 16에서 `middleware.ts`를 대체)가 `lib/supabase/proxy.ts`의 `updateSession`을 호출합니다.
2. **`updateSession`** 은 `supabase.auth.getClaims()`로 세션 쿠키를 갱신하고, 비로그인 사용자를 `/auth/login`으로 리다이렉트합니다.
   - 비로그인 허용 경로: `/`, `/login*`, `/auth*`
   - `createServerClient`와 `getClaims()` 사이에 다른 코드를 넣지 마세요.
   - `getClaims()`를 제거하지 마세요.
3. **Supabase 클라이언트 팩토리**
   - `lib/supabase/server.ts` — `createClient()`, 비동기, `cookies()` 사용
   - `lib/supabase/client.ts` — 브라우저용
   - 서버 클라이언트는 요청/함수마다 새로 생성하고, 모듈 전역 변수에 저장하지 마세요 (Fluid Compute).
4. **`lib/utils.ts`** 가 `hasEnvVars`를 export하며, 환경 변수가 없으면 proxy는 인증 검사를 건너뜁니다.

**라우트**
- `app/auth/{login,sign-up,sign-up-success,forgot-password,update-password,confirm,error}`
- `app/protected` — 인증이 필요한 예제 영역
- 인증 폼은 `components/*-form.tsx`

### Next.js 설정

`next.config.ts`에서 `cacheComponents: true`(Next 16 Cache Components)를 활성화했습니다.

- 페이지/레이아웃에서 동적 데이터 접근(`cookies()`, Supabase 호출 등)은 `<Suspense>` 안에 두거나 Cache Components 규칙에 맞게 처리해야 합니다.
- `allowedDevOrigins`에는 개발용 LAN IP가 들어 있습니다.

## 프로젝트 도구 및 문서

- **`docs/guides/`** — 한국어 컨벤션 문서 (컴포넌트 패턴, 스타일링, react-hook-form, Next.js, 공유 링크 발급). 기능 개발 전에 참고하세요.
  - 문서는 Next.js 15.5.3 기준이지만 `package.json`은 `next: latest`이므로 설치된 버전을 확인하세요.
- **`.mcp.json`** — MCP 서버: Supabase(프로젝트 지정), Playwright, context7, sequential-thinking, shadcn, shrimp-task-manager
- **`.claude/`**
  - `agents/dev`, `agents/docs` — 커스텀 에이전트
  - `commands/git`, `commands/docs` — 슬래시 커맨드 (docs는 ROADMAP 업데이트용)
  - 알림/종료 훅
  - 에이전트와 문서가 한국어로 작성되어 있으므로, 이를 다룰 때는 한국어로 응답하세요.
