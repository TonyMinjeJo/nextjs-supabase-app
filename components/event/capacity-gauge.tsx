import { cn } from "@/lib/utils";

interface CapacityGaugeProps {
  /** 현재 참석 인원 */
  current: number;
  /** 정원 */
  capacity: number;
  className?: string;
}

// 현재 인원/정원 게이지. 정원이 가득 차면 강조색으로 바뀝니다.
export function CapacityGauge({
  current,
  capacity,
  className,
}: CapacityGaugeProps) {
  const ratio = capacity > 0 ? Math.min(current / capacity, 1) : 0;
  const isFull = capacity > 0 && current >= capacity;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{isFull ? "정원 마감" : "참석 인원"}</span>
        <span className="font-medium text-foreground">
          {current}/{capacity}명
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="참석 인원"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={Math.min(current, capacity)}
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isFull ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
