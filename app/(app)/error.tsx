"use client";

import { ErrorView } from "@/components/error-view";

// 로그인 후 영역(내 이벤트, 생성, 상세, 관리)의 오류. 이 파일은 (app) 레이아웃 안에서 렌더링되므로
// 헤더(내 이벤트·이벤트 만들기·로그아웃)가 그대로 남아 다른 화면으로 바로 이동할 수 있습니다.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView error={error} reset={reset} />;
}
