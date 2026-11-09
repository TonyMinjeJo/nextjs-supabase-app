import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/auth/session";
import Link from "next/link";
import { Suspense } from "react";

// 서비스 운영자(admin) 영역 공통 레이아웃. (app)의 500px PageContainer는 사용하지 않습니다.
// lg 이상: 좌측 사이드바 + 콘텐츠(max-w-6xl), lg 미만: 상단 가로 탭.
//
// 접근 제어: profiles.role을 서버에서 조회해 admin이 아니면 안내만 보여주고 /events로 돌려보냅니다.
// 로그인 여부는 proxy가 보장하고, role 변경은 RLS/컬럼 권한이 막습니다.
// (우회용 토글/쿼리 파라미터는 의도적으로 두지 않습니다.)
// 통계·목록 데이터는 아직 더미(lib/mocks)이며, 실데이터 연결은 이후 Task에서 합니다.
// role 조회는 쿠키를 읽으므로 Suspense 안(요청 시점)에서 실행합니다. (Cache Components)
async function AdminGate({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-[500px] items-center px-4">
        <div className="flex w-full flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            관리자만 볼 수 있어요.
          </p>
          <Button asChild>
            <Link href="/events">내 이벤트로 돌아가기</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-b-foreground/10">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/admin" className="shrink-0 font-semibold">
            모임 이벤트 관리자
          </Link>
          <div className="flex items-center text-sm">
            <LogoutButton />
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-8 lg:py-6">
        <aside className="shrink-0 lg:w-48">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-muted-foreground">불러오는 중...</p>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
