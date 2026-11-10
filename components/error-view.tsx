"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

// error.tsx 경계들이 함께 쓰는 오류 안내. "다시 시도"는 해당 구간만 다시 렌더링합니다.
// 서버 컴포넌트 오류의 message는 운영 환경에서 Next가 가리므로, 사용자에게는 digest(오류 번호)만 보여줍니다.
// 서버 컴포넌트에서 난 오류는 reset()만으로는 서버를 다시 부르지 않아(오류 결과가 그대로 남음),
// router.refresh()를 함께 호출해 서버에서 다시 렌더링한 뒤 복구합니다.
export function ErrorView({
  error,
  reset,
  className,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4 py-10 text-center",
        className,
      )}
    >
      <h1 className="text-xl font-bold">문제가 발생했어요</h1>
      <p className="text-sm text-muted-foreground">
        잠시 후 다시 시도해 주세요.
        <br />
        계속되면 주최자에게 알려 주세요.
      </p>
      {isDev && error.message && (
        <p className="max-w-full rounded-md bg-muted px-3 py-2 text-left text-xs break-words text-muted-foreground">
          {error.message}
        </p>
      )}
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          오류 번호: {error.digest}
        </p>
      )}
      <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row">
        <Button className="h-11 flex-1" onClick={retry} disabled={isRetrying}>
          {isRetrying ? "다시 불러오는 중..." : "다시 시도"}
        </Button>
        <Button asChild variant="outline" className="h-11 flex-1">
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </div>
  );
}
