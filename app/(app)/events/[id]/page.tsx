import { AnnouncementBoard } from "@/components/event/announcement-board";
import {
  CancelEventButton,
  DeleteEventButton,
} from "@/components/event/cancel-event-button";
import { CoverImage } from "@/components/event/cover-image";
import { EmptyState } from "@/components/event/empty-state";
import { ParticipantList } from "@/components/event/participant-list";
import { RsvpButtons } from "@/components/event/rsvp-buttons";
import { ShareLinkButton } from "@/components/event/share-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WidePage } from "@/components/page-container";
import { getSessionUser } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/data/announcements";
import { getCoverUrl } from "@/lib/data/event-cover";
import { getEvent } from "@/lib/data/events";
import { getParticipants } from "@/lib/data/participations";
import { formatEventDate } from "@/lib/format";
import { getNowMs } from "@/lib/now";
import type { MeetupEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

// 공지 탭: 실데이터 목록. 작성/고정/삭제는 주최자만, 취소된 이벤트는 읽기 전용
async function AnnouncementsPanel({
  event,
  isHost,
}: {
  event: MeetupEvent;
  isHost: boolean;
}) {
  const items = await getAnnouncements(event.id);
  return (
    <AnnouncementBoard
      eventId={event.id}
      items={items}
      isHost={isHost}
      canceled={!!event.canceled_at}
    />
  );
}

// 참석자 탭: 실데이터 목록 + 내 응답(호스트 포함 전원이 변경 가능)
async function ParticipantsPanel({
  event,
  userId,
}: {
  event: MeetupEvent;
  userId: string | undefined;
}) {
  // 신청 마감 표시에 현재 시각을 쓰므로 요청 시점에 렌더링합니다.
  await connection();
  const participants = await getParticipants(event.id);
  const mine = participants.find((p) => p.userId === userId);
  const closed =
    event.rsvp_deadline !== null &&
    Date.parse(event.rsvp_deadline) < getNowMs();
  const goingCount = participants.filter((p) => p.status === "going").length;

  return (
    <div className="flex flex-col gap-6">
      {event.canceled_at ? (
        <p className="rounded-lg bg-secondary p-3 text-center text-sm text-secondary-foreground">
          취소된 이벤트예요. 더 이상 응답할 수 없어요.
        </p>
      ) : (
        userId && (
          <RsvpButtons
            code={event.share_code}
            initialStatus={mine?.status ?? null}
            waitlistOrder={mine?.waitlistOrder ?? null}
            goingCount={goingCount}
            capacity={event.capacity}
            closed={closed}
          />
        )
      )}
      <ParticipantList
        participants={participants}
        capacity={event.capacity}
        currentUserId={userId}
      />
    </div>
  );
}

async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, user] = await Promise.all([getEvent(id), getSessionUser()]);
  if (!event) notFound();

  const coverUrl = await getCoverUrl(event.cover_image_path);
  const isHost = !!user && event.host_id === user.id;
  const encodedId = encodeURIComponent(event.id);

  // 공지·참석자 탭은 실데이터. 카풀·정산 탭은 Task 010~011에서 DB와 연결합니다.
  const pending = <EmptyState message="준비 중이에요. 곧 이용할 수 있어요." />;

  return (
    <>
      {/* 주최자만 lg 이상에서 넓은 폭을 켭니다. 참여자는 500px 열 유지 */}
      {isHost && <WidePage />}
      {/* 주최자 lg+: 좌측 요약 고정 열 + 우측 탭 영역. 모바일과 참여자는 단일 열 */}
      <div
        className={cn(
          "flex flex-col gap-6",
          isHost && "lg:grid lg:grid-cols-[18rem_1fr] lg:items-start lg:gap-8",
        )}
      >
        <div
          className={cn("flex flex-col gap-3", isHost && "lg:sticky lg:top-4")}
        >
          {coverUrl && (
            <CoverImage
              src={coverUrl}
              alt={`${event.title} 커버 이미지`}
              className="rounded-lg"
            />
          )}
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold">{event.title}</h1>
            <div className="flex shrink-0 items-center gap-1">
              {isHost && <Badge variant="secondary">주최</Badge>}
              {event.canceled_at && <Badge variant="destructive">취소됨</Badge>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatEventDate(event.starts_at)} · {event.location}
          </p>
          {event.description && <p className="text-sm">{event.description}</p>}
          <p className="text-sm text-muted-foreground">
            정원 {event.capacity}명
          </p>
          {isHost && (
            <div className="flex flex-wrap gap-2 lg:flex-col">
              <ShareLinkButton shareCode={event.share_code} />
              {event.canceled_at ? (
                // 취소된 이벤트는 수정·관리 대신 삭제만 가능합니다.
                <DeleteEventButton
                  eventId={event.id}
                  className="flex-1 lg:flex-none"
                />
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-11 flex-1 lg:flex-none"
                  >
                    <Link href={`/events/${encodedId}/edit`}>이벤트 수정</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-11 flex-1 lg:flex-none"
                  >
                    <Link href={`/events/${encodedId}/manage`}>
                      이벤트 관리
                    </Link>
                  </Button>
                  <CancelEventButton
                    eventId={event.id}
                    className="flex-1 lg:flex-none"
                  />
                </>
              )}
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
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              }
            >
              <AnnouncementsPanel event={event} isHost={isHost} />
            </Suspense>
          </TabsContent>
          <TabsContent value="participants">
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              }
            >
              <ParticipantsPanel event={event} userId={user?.id} />
            </Suspense>
          </TabsContent>
          <TabsContent value="carpool">{pending}</TabsContent>
          <TabsContent value="settlement">{pending}</TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// 이벤트 상세 (F001) - 헤더는 실데이터, 탭 4개는 Task 008~011에서 연결
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
