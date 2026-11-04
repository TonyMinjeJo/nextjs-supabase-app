import { z } from "zod";

// 비용 항목 입력 검증 스키마. 금액은 양의 정수(원 단위)입니다.
export const expenseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "항목명을 입력해 주세요.")
    .max(100, "항목명은 100자 이하로 입력해 주세요."),
  amount: z
    .number("금액은 숫자로 입력해 주세요.")
    .int("금액은 정수(원 단위)여야 합니다.")
    .positive("금액은 0보다 커야 합니다."),
  payerId: z.string().min(1, "결제자를 선택해 주세요."),
});

export type ExpenseFormInput = z.infer<typeof expenseFormSchema>;
