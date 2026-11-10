"use client";

import { ErrorView } from "@/components/error-view";
import { PageContainer } from "@/components/page-container";

// 루트 레이아웃 안에서 잡히는 오류(홈, 로그인, 초대 화면 등). 로그인 후 영역은 app/(app)/error.tsx가 먼저 처리합니다.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer className="flex flex-col justify-center">
      <ErrorView error={error} reset={reset} />
    </PageContainer>
  );
}
