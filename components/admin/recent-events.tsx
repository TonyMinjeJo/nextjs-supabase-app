import Link from "next/link";

import { CapacityGauge } from "@/components/event/capacity-gauge";
import { EmptyState } from "@/components/event/empty-state";
import { PaymentBadge } from "@/components/event/payment-badge";
import { formatEventDate } from "@/lib/format";
import type { AdminEventRow } from "@/lib/mocks/admin";
import type { PaymentStatus } from "@/lib/types";

interface RecentEventsProps {
  rows: AdminEventRow[];
}

const STATUSES: PaymentStatus[] = ["unpaid", "marked", "confirmed"];

// 정산 상태별 인원 수. 대상이 없으면 안내 문구만 보여줍니다.
function SettlementSummaryView({
  settlement,
}: {
  settlement: AdminEventRow["settlement"];
}) {
  const total = settlement.unpaid + settlement.marked + settlement.confirmed;
  if (total === 0) {
    return <span className="text-xs text-muted-foreground">정산 없음</span>;
  }
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-1 text-xs">
          <PaymentBadge status={status} />
          <span className="font-medium">{settlement[status]}명</span>
        </li>
      ))}
    </ul>
  );
}

// 최근 이벤트 목록: lg 이상은 표, 미만은 카드형 목록
export function RecentEvents({ rows }: RecentEventsProps) {
  if (rows.length === 0) {
    return <EmptyState message="아직 이벤트가 없습니다." />;
  }

  return (
    <>
      {/* 카드형 (lg 미만) */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4"
          >
            <div className="flex flex-col gap-1">
              <Link
                href={`/events/${row.id}`}
                className="flex min-h-11 items-center break-words font-semibold underline-offset-4 hover:underline"
              >
                {row.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {row.hostName} · {formatEventDate(row.startsAt)}
              </p>
            </div>
            <CapacityGauge current={row.goingCount} capacity={row.capacity} />
            <SettlementSummaryView settlement={row.settlement} />
          </li>
        ))}
      </ul>

      {/* 표 (lg 이상) */}
      <div className="hidden rounded-lg border lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">최근 이벤트 5건</caption>
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th scope="col" className="p-3 font-medium">
                제목
              </th>
              <th scope="col" className="p-3 font-medium">
                주최자
              </th>
              <th scope="col" className="p-3 font-medium">
                일시
              </th>
              <th scope="col" className="w-48 p-3 font-medium">
                참석/정원
              </th>
              <th scope="col" className="p-3 font-medium">
                정산 상태
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <th scope="row" className="p-3 text-left font-medium">
                  <Link
                    href={`/events/${row.id}`}
                    className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                  >
                    {row.title}
                  </Link>
                </th>
                <td className="p-3">{row.hostName}</td>
                <td className="whitespace-nowrap p-3">
                  {formatEventDate(row.startsAt)}
                </td>
                <td className="p-3">
                  <CapacityGauge
                    current={row.goingCount}
                    capacity={row.capacity}
                  />
                </td>
                <td className="p-3">
                  <SettlementSummaryView settlement={row.settlement} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
