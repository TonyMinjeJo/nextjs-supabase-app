// N분의 1 정산 계산 (PRD F007). 화면과 이후 서버 액션이 함께 쓰는 순수 함수입니다.
// 규칙: 출석자 수로 나눈 몫(정수 원)을 각자 부담하고, 나누어떨어지지 않는
// 나머지 원은 결제자가 부담합니다. 결제자 본인은 자기 결제분을 내지 않습니다.

export interface ExpenseInput {
  id: string;
  payer_id: string;
  /** 금액 (정수 원 단위) */
  amount: number;
}

/** 비용 항목별 개인 분담액 */
export interface ShareAmount {
  expense_id: string;
  user_id: string;
  amount: number;
}

/** 사용자별 분담 합계 */
export interface ShareTotal {
  user_id: string;
  amount: number;
}

export function calcShares(
  expenses: ExpenseInput[],
  attendeeIds: string[],
): ShareAmount[] {
  if (attendeeIds.length === 0) return [];

  const shares: ShareAmount[] = [];
  for (const expense of expenses) {
    const perPerson = Math.floor(expense.amount / attendeeIds.length);
    for (const userId of attendeeIds) {
      if (userId === expense.payer_id) continue;
      shares.push({
        expense_id: expense.id,
        user_id: userId,
        amount: perPerson,
      });
    }
  }
  return shares;
}

/** 출석자별 분담 합계 (분담액이 없는 출석자도 0원으로 포함) */
export function sumSharesByUser(
  shares: ShareAmount[],
  attendeeIds: string[],
): ShareTotal[] {
  return attendeeIds.map((userId) => ({
    user_id: userId,
    amount: shares
      .filter((share) => share.user_id === userId)
      .reduce((sum, share) => sum + share.amount, 0),
  }));
}
