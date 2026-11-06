import { CapacityGauge } from "@/components/event/capacity-gauge";
import { ParticipationBadge } from "@/components/event/participation-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatEventDate } from "@/lib/format";
import type { EventCardProps } from "@/lib/types";
import Link from "next/link";

// 내 이벤트 목록의 카드. 카드 전체가 이벤트 상세로 연결됩니다.
export function EventCard({
  event,
  goingCount,
  isHost,
  myStatus,
}: EventCardProps) {
  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}`}
      className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
    >
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="leading-tight font-semibold">{event.title}</h3>
            <div className="flex shrink-0 items-center gap-1">
              {isHost && <Badge variant="secondary">주최</Badge>}
              <ParticipationBadge status={myStatus} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatEventDate(event.starts_at)} · {event.location}
          </p>
          <CapacityGauge current={goingCount} capacity={event.capacity} />
        </CardContent>
      </Card>
    </Link>
  );
}
