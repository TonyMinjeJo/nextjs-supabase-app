/** 비용 항목 (expenses) */
export interface Expense {
  id: string;
  event_id: string;
  /** 결제자 */
  payer_id: string;
  title: string;
  /** 금액 (정수 원 단위) */
  amount: number;
}

/** 정산 분담 (settlement_shares) */
export interface SettlementShare {
  expense_id: string;
  user_id: string;
  /** 분담 금액 (정수 원 단위) */
  amount: number;
  /** 입금 표시 (참여자) */
  paid_marked: boolean;
  /** 입금 확인 (주최자) */
  confirmed: boolean;
}

/** 입금 상태: 미입금 → 입금 표시 → 확인 완료 */
export type PaymentStatus = "unpaid" | "marked" | "confirmed";

/** paid_marked / confirmed 조합에서 입금 상태를 파생합니다. */
export function getPaymentStatus(
  share: Pick<SettlementShare, "paid_marked" | "confirmed">,
): PaymentStatus {
  if (share.confirmed) return "confirmed";
  if (share.paid_marked) return "marked";
  return "unpaid";
}
