import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  /** 안내 아래에 둘 행동 유도 (버튼 등) */
  children?: React.ReactNode;
  className?: string;
}

// 목록이 비었을 때 보여주는 공통 빈 상태
export function EmptyState({ message, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}
