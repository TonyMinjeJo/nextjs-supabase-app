"use client";

import { useEffect } from "react";

// 루트 레이아웃 자체가 실패했을 때의 마지막 안전망. 이 파일은 루트 레이아웃을 대체하므로
// html/body를 직접 그리고, 스타일·테마가 로드되지 않았을 수 있어 인라인 스타일만 씁니다.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 16,
        }}
      >
        <div role="alert" style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 20, margin: "0 0 12px" }}>
            문제가 발생했어요
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
            잠시 후 다시 시도해 주세요.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px" }}>
              오류 번호: {error.digest}
            </p>
          )}
          <button
            type="button"
            // 루트 레이아웃이 없는 상태라 router 대신 페이지 전체를 다시 불러옵니다.
            onClick={() => window.location.reload()}
            style={{
              height: 44,
              padding: "0 20px",
              fontSize: 14,
              borderRadius: 8,
              border: "none",
              background: "#111827",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
