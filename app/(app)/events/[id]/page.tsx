import { AnnouncementBoard } from "@/components/event/announcement-board";
import { CapacityGauge } from "@/components/event/capacity-gauge";
import { CarpoolBoard } from "@/components/event/carpool-board";
import { EmptyState } from "@/components/event/empty-state";
import { ParticipationBadge } from "@/components/event/participation-badge";
import { SettlementPanel } from "@/components/event/settlement-panel";
import { ShareLinkButton } from "@/components/event/share-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEventDate } from "@/lib/format";
import {
  CURRENT_USER_ID,
  getAnnouncements,
  getEventById,
  getExpenses,
  getGoingCount,
  getParticipantRows,
  getSettlementRows,
  getTransferAccount,
  getUserName,
  passengers,
  rides,
} from "@/lib/mocks";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const isHost = event.host_id === CURRENT_USER_ID;
  const participants = getParticipantRows(event.id);
  const goingRows = participants.filter((row) => row.status === "going");
  const names = Object.fromEntries(
    participants.map((row) => [row.userId, row.name]),
  );
  // 운전자 이름도 필요하므로 참석자 외 사용자(주최자 등)를 보충합니다.
  for (const ride of rides.filter((r) => r.event_id === event.id)) {
    names[ride.driver_id] ??= getUserName(ride.driver_id);
  }
  const eventRideIds = new Set(
    rides.filter((r) => r.event_id === event.id).map((r) => r.id),
  );
  const myRow = participants.find((row) => row.userId === CURRENT_USER_ID);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold">{event.title}</h1>
          <div className="flex shrink-0 items-center gap-1">
            {isHost && <Badge variant="secondary">주최</Badge>}
            <ParticipationBadge status={myRow?.status ?? null} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatEventDate(event.starts_at)} · {event.location}
        </p>
        {event.description && <p className="text-sm">{event.description}</p>}
        <CapacityGauge
          current={getGoingCount(event.id)}
          capacity={event.capacity}
        />
        {isHost && (
          <div className="flex gap-2">
            <ShareLinkButton shareCode={event.share_code} />
            <Button asChild variant="outline" size="sm" className="h-11 flex-1">
              <Link href={`/events/${encodeURIComponent(event.id)}/manage`}>
                이벤트 관리
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="announcements">
        <TabsList className="w-full">
          <TabsTrigger value="announcements">공지</TabsTrigger>
          <TabsTrigger value="participants">참석자</TabsTrigger>
          <TabsTrigger value="carpool">카풀</TabsTrigger>
          <TabsTrigger value="settlement">정산</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <AnnouncementBoard
            eventId={event.id}
            initialItems={getAnnouncements(event.id)}
            isHost={isHost}
          />
        </TabsContent>

        <TabsContent value="participants">
          {participants.length === 0 ? (
            <EmptyState message="참석자가 없습니다." />
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {participants.map((row) => (
                <li
                  key={row.userId}
                  className="flex items-center justify-between gap-2 p-3"
                >
                  <span className="text-sm">{row.name}</span>
                  <ParticipationBadge
                    status={row.status}
                    waitlistOrder={row.waitlistOrder}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="carpool">
          <CarpoolBoard
            eventId={event.id}
            initialRides={rides.filter((r) => r.event_id === event.id)}
            initialPassengers={passengers.filter((p) =>
              eventRideIds.has(p.ride_id),
            )}
            names={names}
            goingUserIds={goingRows.map((row) => row.userId)}
            myUserId={CURRENT_USER_ID}
          />
        </TabsContent>

        <TabsContent value="settlement">
          <SettlementPanel
            rows={getSettlementRows(event.id)}
            account={getTransferAccount(event.id)}
            isHost={isHost}
            myUserId={CURRENT_USER_ID}
            manageHref={`/events/${encodeURIComponent(event.id)}/manage`}
            hasExpenses={getExpenses(event.id).length > 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 이벤트 상세 (F001~F004, F006, F007) - 주최자/참여자 뷰 분기
export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">불러오는 중...</p>}
    >
      <EventDetail params={params} />
    </Suspense>
  );
}
