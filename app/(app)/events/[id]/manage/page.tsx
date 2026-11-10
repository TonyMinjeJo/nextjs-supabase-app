import { LoadingState } from "@/components/loading-state";
import { AttendanceChecklist } from "@/components/event/attendance-checklist";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { getEvent } from "@/lib/data/events";
import { getParticipants } from "@/lib/data/participations";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function EventManage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, user] = await Promise.all([getEvent(id), getSessionUser()]);
  if (!event) notFound();

  const detailHref = `/events/${encodeURIComponent(event.id)}`;

  // 주최자 전용 화면: 참여자는 안내만 보여주고 상세로 돌려보냅니다.
  if (!user || event.host_id !== user.id) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          이벤트 관리는 주최자만 할 수 있어요.
        </p>
        <Button asChild>
          <Link href={detailHref}>이벤트 상세로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  const participants = await getParticipants(event.id);
  const goingRows = participants.filter((p) => p.status === "going");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">이벤트 관리</h1>
          <p className="text-sm text-muted-foreground">{event.title}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-11">
          <Link href={detailHref}>상세로</Link>
        </Button>
      </div>
      <AttendanceChecklist eventId={event.id} goingRows={goingRows} />
    </div>
  );
}

// 이벤트 관리 (F005) - 주최자 전용 출석 체크
export default function EventManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EventManage params={params} />
    </Suspense>
  );
}
