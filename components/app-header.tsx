import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 로그인 후 영역(app/(app))의 공통 헤더.
// 이 영역은 proxy에서 로그인이 보장되므로 서버 인증 조회 없이 정적으로 렌더링합니다.
export function AppHeader() {
  return (
    <header className="w-full border-b border-b-foreground/10">
      <div className="mx-auto flex h-14 w-full items-center justify-between gap-2 px-4">
        <Link href="/events" className="shrink-0 font-semibold">
          모임 이벤트
        </Link>
        <nav className="flex items-center text-sm">
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/events">내 이벤트</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/events/new">이벤트 만들기</Link>
          </Button>
          <LogoutButton />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
