"use client";

import { CapacityGauge } from "@/components/event/capacity-gauge";
import { EmptyState } from "@/components/event/empty-state";
import { PaymentBadge } from "@/components/event/payment-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEventDate } from "@/lib/format";
import type { AdminEventRow, SettlementSummary } from "@/lib/mocks/admin";
import Link from "next/link";
import { useState } from "react";

type EventFilter = "all" | "upcoming" | "past";

const FILTERS: { value: EventFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "upcoming", label: "예정" },
  { value: "past", label: "지난" },
];

interface EventTableProps {
  rows: AdminEventRow[];
}

// 정산 상태별 인원 수. 0명인 상태는 숨겨 표를 간결하게 유지합니다.
function SettlementCounts({ settlement }: { settlement: SettlementSummary }) {
  const items = [
    { status: "unpaid", count: settlement.unpaid },
    { status: "marked", count: settlement.marked },
    { status: "confirmed", count: settlement.confirmed },
  ] as const;
  const visible = items.filter((item) => item.count > 0);

  if (visible.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">정산 대상 없음</span>
    );
  }
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {visible.map((item) => (
        <li key={item.status} className="flex items-center gap-1">
          <PaymentBadge status={item.status} />
          <span className="text-sm">{item.count}명</span>
        </li>
      ))}
    </ul>
  );
}

// 운영자 이벤트 표: lg 이상은 table, 그 미만은 카드 목록
export function EventTable({ rows }: EventTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventFilter>("all");

  const keyword = query.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (filter === "upcoming" && !row.isUpcoming) return false;
    if (filter === "past" && row.isUpcoming) return false;
    if (!keyword) return true;
    return (
      row.title.toLowerCase().includes(keyword) ||
      row.hostName.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Label htmlFor="admin-event-search" className="sr-only">
            제목 또는 주최자 검색
          </Label>
          <Input
            id="admin-event-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목 또는 주최자 검색"
            className="h-11"
          />
        </div>
        <div role="group" aria-label="일정 필터" className="flex gap-2">
          {FILTERS.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={filter === item.value ? "default" : "outline"}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className="h-11 flex-1 sm:flex-none"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">
        {filtered.length}개의 이벤트
      </p>

      {filtered.length === 0 ? (
        <EmptyState message="조건에 맞는 이벤트가 없습니다." />
      ) : (
        <>
          {/* lg 이상: 표 */}
          <div className="hidden overflow-hidden rounded-lg border lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                이벤트 목록: 제목, 주최자, 일시, 참석 인원, 정산 상태, 공유 코드
              </caption>
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">
                    제목
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    주최자
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    일시
                  </th>
                  <th scope="col" className="w-40 px-3 py-3 font-medium">
                    참석/정원
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    정산 상태
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    공유 코드
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="px-3 py-3 font-medium">
                      <Link
                        href={`/events/${row.id}`}
                        className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                      >
                        {row.title}
                      </Link>
                    </th>
                    <td className="px-3 py-3">{row.hostName}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatEventDate(row.startsAt)}
                    </td>
                    <td className="px-3 py-3">
                      <CapacityGauge
                        current={row.goingCount}
                        capacity={row.capacity}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <SettlementCounts settlement={row.settlement} />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {row.shareCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* lg 미만: 카드 목록 */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {filtered.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground"
              >
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/events/${row.id}`}
                    className="inline-flex min-h-11 items-center font-semibold break-words underline-offset-4 hover:underline"
                  >
                    {row.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {row.hostName} · {formatEventDate(row.startsAt)}
                  </p>
                </div>
                <CapacityGauge
                  current={row.goingCount}
                  capacity={row.capacity}
                />
                <SettlementCounts settlement={row.settlement} />
                <p className="text-xs text-muted-foreground">
                  공유 코드{" "}
                  <span className="font-mono text-foreground">
                    {row.shareCode}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
