import { AppHeader } from "@/components/app-header";

// 로그인 후 영역 공통 레이아웃 (내 이벤트, 이벤트 생성/상세/관리)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="mx-auto w-full flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
