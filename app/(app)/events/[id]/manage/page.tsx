import { ManageBoard } from "@/components/event/manage-board";
import { Button } from "@/components/ui/button";
import {
  CURRENT_USER_ID,
  getEventById,
  getExpenses,
  getInitialPaymentStatus,
  getParticipantRows,
} from "@/lib/mocks";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function EventManage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const detailHref = `/events/${encodeURIComponent(event.id)}`;

  // 주최자 전용 화면: 참여자는 안내만 보여주고 상세로 돌려보냅니다.
  // (실제 권한 검사는 Phase 3에서 서버/RLS로 이중 확인)
  if (event.host_id !== CURRENT_USER_ID) {
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

  const goingRows = getParticipantRows(event.id).filter(
    (row) => row.status === "going",
  );

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
      <ManageBoard
        eventId={event.id}
        goingRows={goingRows}
        initialExpenses={getExpenses(event.id)}
        initialPayments={Object.fromEntries(
          goingRows.map((row) => [
            row.userId,
            getInitialPaymentStatus(event.id, row.userId),
          ]),
        )}
      />
    </div>
  );
}

// 이벤트 관리 (F005, F007) - 출석 체크, 비용 입력, 정산 표
export default function EventManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">불러오는 중...</p>}
    >
      <EventManage params={params} />
    </Suspense>
  );
}
