import { EmptyState } from "@/components/event/empty-state";
import { EventCard } from "@/components/event/event-card";
import { ShareLinkButton } from "@/components/event/share-link-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENT_USER_ID, getMyEvents } from "@/lib/mocks";
import { getNowMs } from "@/lib/now";
import type { EventCardProps } from "@/lib/types";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";

function EventItem(props: EventCardProps) {
  return (
    <li className="flex flex-col gap-2">
      <EventCard {...props} />
      {props.isHost && (
        <div className="flex gap-2">
          <ShareLinkButton shareCode={props.event.share_code} />
          <Button asChild variant="outline" size="sm" className="h-11 flex-1">
            <Link
              href={`/events/new?from=${encodeURIComponent(props.event.id)}`}
            >
              복제해서 만들기
            </Link>
          </Button>
        </div>
      )}
    </li>
  );
}

function EventSection({
  title,
  items,
}: {
  title: string;
  items: EventCardProps[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <EventItem key={item.event.id} {...item} />
        ))}
      </ul>
    </section>
  );
}

function EventGroups({
  items,
  nowMs,
  emptyMessage,
}: {
  items: EventCardProps[];
  nowMs: number;
  emptyMessage: string;
}) {
  const isUpcoming = (item: EventCardProps) =>
    Date.parse(item.event.starts_at) >= nowMs;
  // 예정은 가까운 순, 지난 이벤트는 최근 순
  const upcoming = items.filter(isUpcoming).reverse();
  const past = items.filter((item) => !isUpcoming(item));

  if (items.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div className="flex flex-col gap-6">
      <EventSection title="예정된 이벤트" items={upcoming} />
      <EventSection title="지난 이벤트" items={past} />
    </div>
  );
}

// 현재 시각으로 예정/지난을 나누므로 요청 시점에 렌더링합니다. (Cache Components)
async function MyEventsContent() {
  await connection();
  const nowMs = getNowMs();
  const all = getMyEvents(CURRENT_USER_ID);

  return (
    <Tabs defaultValue="all">
      <TabsList className="w-full">
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="hosting">주최</TabsTrigger>
        <TabsTrigger value="joined">참여</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <EventGroups
          items={all}
          nowMs={nowMs}
          emptyMessage="아직 이벤트가 없습니다."
        />
      </TabsContent>
      <TabsContent value="hosting">
        <EventGroups
          items={all.filter((item) => item.isHost)}
          nowMs={nowMs}
          emptyMessage="주최한 이벤트가 없습니다."
        />
      </TabsContent>
      <TabsContent value="joined">
        <EventGroups
          items={all.filter((item) => !item.isHost)}
          nowMs={nowMs}
          emptyMessage="참여한 이벤트가 없습니다."
        />
      </TabsContent>
    </Tabs>
  );
}

// 내 이벤트 (F011)
export default function MyEventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">내 이벤트</h1>
        <Button asChild size="sm">
          <Link href="/events/new">이벤트 만들기</Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        }
      >
        <MyEventsContent />
      </Suspense>
    </div>
  );
}
