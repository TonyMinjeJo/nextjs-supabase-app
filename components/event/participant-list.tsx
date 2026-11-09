import { CapacityGauge } from "@/components/event/capacity-gauge";
import { EmptyState } from "@/components/event/empty-state";
import { ParticipationBadge } from "@/components/event/participation-badge";
import type { ParticipantRowProps, ParticipationStatus } from "@/lib/types";

interface ParticipantListProps {
  participants: ParticipantRowProps[];
  capacity: number;
  currentUserId?: string;
}

const SECTIONS: { status: ParticipationStatus; title: string }[] = [
  { status: "going", title: "참석" },
  { status: "waitlist", title: "대기" },
  { status: "not_going", title: "불참" },
];

// 참석자 탭 본문: 정원 게이지 + 참석/대기(순번)/불참 구역 (서버 컴포넌트, 표시 전용)
export function ParticipantList({
  participants,
  capacity,
  currentUserId,
}: ParticipantListProps) {
  const goingCount = participants.filter((p) => p.status === "going").length;

  return (
    <div className="flex flex-col gap-4">
      <CapacityGauge current={goingCount} capacity={capacity} />
      {participants.length === 0 ? (
        <EmptyState message="아직 응답한 사람이 없어요." />
      ) : (
        SECTIONS.map(({ status, title }) => {
          const rows = participants.filter((p) => p.status === status);
          if (rows.length === 0) return null;
          return (
            <section key={status} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">
                {title} {rows.length}명
              </h3>
              <ul className="flex flex-col divide-y rounded-lg border">
                {rows.map((row) => (
                  <li
                    key={row.userId}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {row.name}
                      {row.userId === currentUserId && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (나)
                        </span>
                      )}
                    </span>
                    <ParticipationBadge
                      status={row.status}
                      waitlistOrder={row.waitlistOrder}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
