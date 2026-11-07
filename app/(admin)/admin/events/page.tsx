import { EventTable } from "@/components/admin/event-table";
import { getAdminEventRows } from "@/lib/mocks/admin";
import { getNowMs } from "@/lib/now";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = { title: "이벤트 관리" };

// 예정/지난 판단에 현재 시각이 필요하므로 요청 시점에 렌더링합니다. (Cache Components)
async function EventsContent() {
  await connection();
  const rows = getAdminEventRows(getNowMs());
  return <EventTable rows={rows} />;
}

export default function AdminEventsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">이벤트</h1>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        }
      >
        <EventsContent />
      </Suspense>
    </div>
  );
}
