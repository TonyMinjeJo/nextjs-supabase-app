import { connection } from "next/server";
import { Suspense } from "react";

import { RecentEvents } from "@/components/admin/recent-events";
import { StatCard } from "@/components/admin/stat-card";
import { getAdminEventRows, getAdminStats } from "@/lib/mocks/admin";
import { getNowMs } from "@/lib/now";

// 예정/지난 구분이 현재 시각에 의존하므로 요청 시점에 렌더링합니다. (Cache Components)
async function DashboardContent() {
  await connection();
  const nowMs = getNowMs();
  const stats = getAdminStats(nowMs);
  const recent = getAdminEventRows(nowMs).slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="stats-heading" className="flex flex-col gap-3">
        <h2 id="stats-heading" className="sr-only">
          통계
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard title="전체 이벤트" value={`${stats.totalEvents}건`} />
          <StatCard
            title="예정 / 지난"
            value={`${stats.upcomingEvents} / ${stats.pastEvents}`}
            description={`예정 ${stats.upcomingEvents} · 지난 ${stats.pastEvents}`}
          />
          <StatCard title="전체 사용자" value={`${stats.totalUsers}명`} />
          <StatCard title="평균 참석률" value={`${stats.avgAttendanceRate}%`} />
          <StatCard
            title="정산 진행 중"
            value={`${stats.settlementInProgress}건`}
            description="이벤트 기준"
          />
          <StatCard
            title="입금 미확인"
            value={`${stats.unconfirmedPayments}건`}
            description="입금 표시 후 확인 대기"
          />
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <h2 id="recent-heading" className="text-lg font-semibold">
          최근 이벤트
        </h2>
        <RecentEvents rows={recent} />
      </section>
    </div>
  );
}

// 운영자 대시보드
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">대시보드</h1>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
