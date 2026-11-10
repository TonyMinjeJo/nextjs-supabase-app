import { AppHeader } from "@/components/app-header";
import { PageContainer } from "@/components/page-container";

// 로그인 후 영역 공통 레이아웃 (내 이벤트, 이벤트 생성/상세/관리)
// 헤더와 본문이 같은 컨테이너 안에 있어 폭이 항상 정렬됩니다.
// 기본은 500px 열이며, 페이지가 <WidePage />를 렌더링하면 lg 이상에서만 max-w-5xl로 넓어집니다.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer className="flex flex-col lg:has-[[data-page-wide]]:max-w-5xl">
      {/* 키보드 사용자가 헤더를 건너뛰고 바로 본문으로 가는 링크. 평소엔 숨겨져 있고 Tab으로 포커스하면 보입니다. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        본문으로 건너뛰기
      </a>
      <AppHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full flex-1 px-4 py-6 outline-none"
      >
        {children}
      </main>
    </PageContainer>
  );
}
