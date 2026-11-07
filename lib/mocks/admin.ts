import type { PaymentStatus, UserRole } from "@/lib/types";
import { events } from "./events";
import { getGoingCount, participations } from "./participations";
import { getSettlementRows } from "./settlement";
import { getUserName, users } from "./users";

// 운영자(admin) 화면용 집계 (Phase 2 더미). Phase 3에서 DB 집계 쿼리로 교체합니다.
// 순수 함수입니다. "예정/지난" 판단용 현재 시각은 호출 측에서
// `await connection()` 후 getNowMs()로 얻어 nowMs로 넘깁니다. (Cache Components)

/** 정산 상태 요약: 상태별 인원 수 */
export interface SettlementSummary {
  unpaid: number;
  marked: number;
  confirmed: number;
}

export interface AdminStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalUsers: number;
  /** 평균 참석률 (0~100 정수 %) = 이벤트별 참석/정원의 평균 */
  avgAttendanceRate: number;
  /** 정산 대상이 있고 확인 완료되지 않은 인원이 남은 이벤트 수 */
  settlementInProgress: number;
  /** 입금 표시(marked) 상태로 주최자 확인을 기다리는 건수 */
  unconfirmedPayments: number;
}

export interface AdminEventRow {
  id: string;
  title: string;
  hostName: string;
  startsAt: string;
  goingCount: number;
  capacity: number;
  isUpcoming: boolean;
  settlement: SettlementSummary;
  shareCode: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  role: UserRole;
  hostedCount: number;
  joinedCount: number;
}

function summarizeSettlement(eventId: string): SettlementSummary {
  const summary: SettlementSummary = { unpaid: 0, marked: 0, confirmed: 0 };
  for (const row of getSettlementRows(eventId)) {
    // 0원 행(결제자 본인 등)은 입금 대상이 아니므로 집계에서 제외합니다.
    if (row.amount <= 0) continue;
    const status: PaymentStatus = row.paymentStatus;
    summary[status] += 1;
  }
  return summary;
}

/** 이벤트 표 행 (시작 시각 내림차순) */
export function getAdminEventRows(nowMs: number): AdminEventRow[] {
  return [...events]
    .sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at))
    .map((event) => ({
      id: event.id,
      title: event.title,
      hostName: getUserName(event.host_id),
      startsAt: event.starts_at,
      goingCount: getGoingCount(event.id),
      capacity: event.capacity,
      isUpcoming: Date.parse(event.starts_at) >= nowMs,
      settlement: summarizeSettlement(event.id),
      shareCode: event.share_code,
    }));
}

/** 사용자 표 행: 주최 수(host_id), 참여 수(참석 going 응답) */
export function getAdminUserRows(): AdminUserRow[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    hostedCount: events.filter((event) => event.host_id === user.id).length,
    joinedCount: participations.filter(
      (item) => item.user_id === user.id && item.status === "going",
    ).length,
  }));
}

/** 대시보드 통계 */
export function getAdminStats(nowMs: number): AdminStats {
  const rows = getAdminEventRows(nowMs);
  const upcomingEvents = rows.filter((row) => row.isUpcoming).length;
  // 정원이 0 이하인 이벤트는 평균에서 제외하고, 이벤트별 참석률은 100%로 제한합니다.
  const rates = rows
    .filter((row) => row.capacity > 0)
    .map((row) => Math.min(1, row.goingCount / row.capacity));
  const avg = rates.length
    ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length
    : 0;

  return {
    totalEvents: rows.length,
    upcomingEvents,
    pastEvents: rows.length - upcomingEvents,
    totalUsers: users.length,
    avgAttendanceRate: Math.round(avg * 100),
    settlementInProgress: rows.filter(
      (row) => row.settlement.unpaid + row.settlement.marked > 0,
    ).length,
    unconfirmedPayments: rows.reduce(
      (sum, row) => sum + row.settlement.marked,
      0,
    ),
  };
}
