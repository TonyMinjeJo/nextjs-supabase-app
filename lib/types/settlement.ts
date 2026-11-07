import type { Enums, Tables } from "@/lib/supabase/database.types";

/** 비용 항목 (expenses). 금액은 정수 원 단위입니다. */
export type Expense = Pick<
  Tables<"expenses">,
  "id" | "event_id" | "payer_id" | "name" | "amount"
>;

/** 입금 상태: 미입금 → 입금 표시 → 확인 완료 */
export type PaymentStatus = Enums<"payment_status">;

/**
 * 정산 분담 (settlement_shares). 이벤트·사용자별 1행이며 amount는 총 분담액입니다.
 * 항목별 분담 내역은 DB에 두지 않고 lib/settlement.ts의 calcShares로 계산합니다.
 */
export type SettlementShare = Tables<"settlement_shares">;
