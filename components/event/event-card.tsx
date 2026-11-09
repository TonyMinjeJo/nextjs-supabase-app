import { CoverImage } from "@/components/event/cover-image";
import { CapacityGauge } from "@/components/event/capacity-gauge";
import { ParticipationBadge } from "@/components/event/participation-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatEventDate } from "@/lib/format";
import type { EventCardProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

// 내 이벤트 목록의 카드. 카드 전체가 이벤트 상세로 연결됩니다.
export function EventCard({
  event,
  goingCount,
  isHost,
  myStatus,
  coverUrl,
}: EventCardProps & {
  /** 커버 이미지 서명 URL (없으면 배너 없이 표시) */
  coverUrl?: string | null;
}) {
  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}`}
      className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
    >
      <Card
        className={cn(
          // 상하 여백은 CardContent의 p-4 하나로만 결정합니다. (Card 기본 py-6와 중복 방지)
          "gap-0 overflow-hidden py-0 transition-colors hover:bg-accent/50",
          event.canceled_at && "opacity-60",
        )}
      >
        {coverUrl && <CoverImage src={coverUrl} alt={`${event.title} 커버`} />}
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 leading-tight font-semibold break-words">
              {event.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1">
              {isHost && <Badge variant="secondary">주최</Badge>}
              {event.canceled_at ? (
                <Badge variant="destructive">취소됨</Badge>
              ) : (
                <ParticipationBadge status={myStatus} />
              )}
            </div>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {formatEventDate(event.starts_at)} · {event.location}
          </p>
          <CapacityGauge current={goingCount} capacity={event.capacity} />
        </CardContent>
      </Card>
    </Link>
  );
}
