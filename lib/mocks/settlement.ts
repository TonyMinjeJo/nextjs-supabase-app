import type { Expense, PaymentStatus, SettlementRowProps } from "@/lib/types";
import { calcShares, sumSharesByUser } from "@/lib/settlement";
import { getParticipations } from "./participations";
import { getUserName } from "./users";

export const expenses: Expense[] = [
  {
    id: "x1",
    event_id: "e4",
    payer_id: "u1",
    name: "구장 대관",
    amount: 50000,
  },
  {
    id: "x2",
    event_id: "e4",
    payer_id: "u2",
    name: "음료·간식",
    amount: 23000,
  },
  {
    id: "x3",
    event_id: "e5",
    payer_id: "u3",
    name: "러닝 후 식사",
    amount: 36000,
  },
];

/** 입금 상태 (이벤트:사용자). 기록이 없으면 미입금 */
const paymentStatuses: Record<string, PaymentStatus> = {
  "e4:u1": "confirmed",
  "e4:u2": "marked",
  "e5:u4": "confirmed",
};

/** 송금 안내 계좌 (예시 값). 참여자에게만 노출합니다. */
const transferAccounts: Record<string, string> = {
  e4: "카카오뱅크 3333-01-0000000 (조민제)",
  e5: "토스뱅크 1000-0000-0000 (이서준)",
};

export function getExpenses(eventId: string): Expense[] {
  return expenses.filter((item) => item.event_id === eventId);
}

export function getTransferAccount(eventId: string): string | null {
  return transferAccounts[eventId] ?? null;
}

/** 출석(attended)한 참석자 ID */
export function getAttendeeIds(eventId: string): string[] {
  return getParticipations(eventId)
    .filter((item) => item.status === "going" && item.attended)
    .map((item) => item.user_id);
}

export function getInitialPaymentStatus(
  eventId: string,
  userId: string,
): PaymentStatus {
  return paymentStatuses[`${eventId}:${userId}`] ?? "unpaid";
}

/** 정산 표 행: 출석자별 분담 합계와 입금 상태 */
export function getSettlementRows(eventId: string): SettlementRowProps[] {
  const attendeeIds = getAttendeeIds(eventId);
  const shares = calcShares(getExpenses(eventId), attendeeIds);
  return sumSharesByUser(shares, attendeeIds).map((total) => ({
    userId: total.user_id,
    name: getUserName(total.user_id),
    amount: total.amount,
    paymentStatus: getInitialPaymentStatus(eventId, total.user_id),
  }));
}
