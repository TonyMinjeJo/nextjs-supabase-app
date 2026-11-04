import { Badge } from "@/components/ui/badge";
import type { ParticipationStatus } from "@/lib/types";

interface ParticipationBadgeProps {
  /** 응답 전이면 null */
  status: ParticipationStatus | null;
  /** 대기 순번 (status가 waitlist일 때만 표시) */
  waitlistOrder?: number;
}

// 참석 상태를 한국어 뱃지로 표시합니다.
export function ParticipationBadge({
  status,
  waitlistOrder,
}: ParticipationBadgeProps) {
  switch (status) {
    case "going":
      return <Badge>참석</Badge>;
    case "not_going":
      return <Badge variant="secondary">불참</Badge>;
    case "waitlist":
      return (
        <Badge variant="outline">
          {waitlistOrder ? `대기 ${waitlistOrder}번` : "대기"}
        </Badge>
      );
    default:
      return <Badge variant="outline">미응답</Badge>;
  }
}
