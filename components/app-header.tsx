import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/auth/session";
import Link from "next/link";
import { Suspense } from "react";

// "관리자" 링크: profiles.role을 서버에서 조회합니다. 쿠키를 읽는 비동기 조회라
// Suspense 안에 두고, 나머지 헤더는 정적으로 렌더링합니다. (Cache Components)
async function AdminLink() {
  if (!(await isAdmin())) return null;
  return (
    <Button asChild variant="ghost" size="sm" className="px-2">
      <Link href="/admin">관리자</Link>
    </Button>
  );
}

// 로그인 후 영역(app/(app))의 공통 헤더.
// 이 영역은 proxy에서 로그인이 보장되므로 로그인 여부 조회 없이 정적으로 렌더링합니다.
// 모바일(sm 미만)은 2줄: 1줄 로고 + 관리자·로그아웃·테마, 2줄 내 이벤트·이벤트 만들기.
// sm 이상은 1줄입니다. DOM 순서는 로고 → nav → 액션이며, 모바일은 order로 시각 순서만 바꿉니다.
// (모바일 포커스 순서와 시각 순서가 다른 것은 의도된 트레이드오프)
export function AppHeader() {
  return (
    <header className="w-full border-b border-b-foreground/10">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-x-2 px-4 py-1 sm:h-14 sm:flex-nowrap sm:py-0">
        <Link
          href="/events"
          className="order-1 flex h-10 shrink-0 items-center font-semibold sm:h-auto"
        >
          모임 이벤트
        </Link>
        <nav
          aria-label="주 메뉴"
          className="order-3 flex w-full items-center text-sm sm:order-2 sm:w-auto"
        >
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/events">내 이벤트</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/events/new">이벤트 만들기</Link>
          </Button>
        </nav>
        <div className="order-2 flex items-center text-sm sm:order-3">
          <Suspense fallback={null}>
            <AdminLink />
          </Suspense>
          <LogoutButton />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
