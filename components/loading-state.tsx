import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Suspense fallback 등 데이터를 기다리는 동안 보여주는 공용 로딩 표시.
// role="status"라 스크린리더가 "불러오는 중"을 읽어 주고, 움직임 줄이기 설정에서는 회전하지 않습니다.
export function LoadingState({
  label = "불러오는 중...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2
        aria-hidden="true"
        className="size-4 animate-spin motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}
