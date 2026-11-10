import { LoadingState } from "@/components/loading-state";
import { EventForm } from "@/components/event/event-form";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { getCoverUrl } from "@/lib/data/event-cover";
import { getEvent } from "@/lib/data/events";
import { toKstLocal } from "@/lib/datetime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function EditEventContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, user] = await Promise.all([getEvent(id), getSessionUser()]);
  if (!event) notFound();

  const detailHref = `/events/${encodeURIComponent(event.id)}`;

  // 주최자 전용 화면. 실제 수정 권한은 서버 액션과 RLS가 다시 확인합니다.
  if (!user || event.host_id !== user.id) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          이벤트 수정은 주최자만 할 수 있어요.
        </p>
        <Button asChild>
          <Link href={detailHref}>이벤트 상세로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  // 취소된 이벤트는 수정할 수 없습니다. (서버 액션도 거부)
  if (event.canceled_at) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          취소된 이벤트는 수정할 수 없어요.
        </p>
        <Button asChild>
          <Link href={detailHref}>이벤트 상세로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  const coverUrl = await getCoverUrl(event.cover_image_path);

  return (
    <EventForm
      eventId={event.id}
      coverUrl={coverUrl}
      defaultValues={{
        coverImagePath: event.cover_image_path,
        title: event.title,
        description: event.description ?? "",
        startsAt: toKstLocal(event.starts_at),
        location: event.location,
        capacity: event.capacity,
        rsvpDeadline: event.rsvp_deadline
          ? toKstLocal(event.rsvp_deadline)
          : "",
      }}
    />
  );
}

// 이벤트 수정 (F001)
export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">이벤트 수정</h1>
      <Suspense fallback={<LoadingState />}>
        <EditEventContent params={params} />
      </Suspense>
    </div>
  );
}
