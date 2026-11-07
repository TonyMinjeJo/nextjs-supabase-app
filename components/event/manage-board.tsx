"use client";

import { EmptyState } from "@/components/event/empty-state";
import { PaymentBadge } from "@/components/event/payment-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatWon } from "@/lib/format";
import { calcShares, sumSharesByUser } from "@/lib/settlement";
import type { Expense, ParticipantRowProps, PaymentStatus } from "@/lib/types";
import {
  expenseFormSchema,
  type ExpenseFormInput,
} from "@/lib/validations/expense";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface ManageBoardProps {
  eventId: string;
  /** 참석(going) 응답자 */
  goingRows: ParticipantRowProps[];
  initialExpenses: Expense[];
  initialPayments: Record<string, PaymentStatus>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

// 이벤트 관리: 출석 체크 → 비용 입력 → 1인당 금액/입금 확인. 한 상태를 공유해
// 출석이나 비용이 바뀌면 정산 표가 즉시 갱신됩니다. (더미 상태, 저장되지 않음)
export function ManageBoard({
  eventId,
  goingRows,
  initialExpenses,
  initialPayments,
}: ManageBoardProps) {
  const [attended, setAttended] = useState<Record<string, boolean>>(
    Object.fromEntries(goingRows.map((row) => [row.userId, row.attended])),
  );
  const [expenses, setExpenses] = useState(initialExpenses);
  const [payments, setPayments] = useState(initialPayments);
  // 입금이 한 건이라도 확인되면 분담액이 바뀌지 않도록 출석·비용 수정을 잠급니다.
  const locked = Object.values(payments).some(
    (status) => status === "confirmed",
  );

  const nameOf = (userId: string) =>
    goingRows.find((row) => row.userId === userId)?.name ?? "알 수 없음";

  const attendeeIds = goingRows
    .filter((row) => attended[row.userId])
    .map((row) => row.userId);
  const shares = calcShares(expenses, attendeeIds);
  const totals = sumSharesByUser(shares, attendeeIds);
  const totalCost = expenses.reduce((sum, item) => sum + item.amount, 0);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { name: "", amount: undefined, payerId: "" },
  });

  function addExpense(values: ExpenseFormInput) {
    setExpenses([
      ...expenses,
      {
        id: crypto.randomUUID(),
        event_id: eventId,
        payer_id: values.payerId,
        name: values.name,
        amount: values.amount,
      },
    ]);
    reset({ name: "", amount: undefined, payerId: "" });
    toast.success("비용 항목을 추가했어요.");
  }

  function confirmPayment(userId: string) {
    setPayments({ ...payments, [userId]: "confirmed" });
    toast.success(`${nameOf(userId)} 님의 입금을 확인했어요.`);
  }

  // 입금 확인 버튼: 표시 조건과 동작은 모바일 목록과 데스크톱 표가 공유합니다.
  const renderConfirmButton = (userId: string) =>
    (payments[userId] ?? "unpaid") === "marked" && (
      <Button size="sm" className="h-11" onClick={() => confirmPayment(userId)}>
        입금 확인
      </Button>
    );

  const renderPayment = (userId: string, amount: number) =>
    amount === 0 ? (
      <span className="text-sm text-muted-foreground">보낼 금액 없음</span>
    ) : (
      <>
        <PaymentBadge status={payments[userId] ?? "unpaid"} />
        {renderConfirmButton(userId)}
      </>
    );

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      {locked && (
        <p
          role="status"
          className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground lg:col-span-2"
        >
          입금이 확인되어 출석과 비용을 더 이상 수정할 수 없어요. 분담액이
          바뀌지 않도록 잠겨 있어요.
        </p>
      )}
      {/* 좌측 열: 출석 + 비용 (모바일에서는 그대로 세로로 이어집니다) */}
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">출석 체크</h2>
            <span className="text-sm text-muted-foreground">
              {attendeeIds.length}/{goingRows.length}명 출석
            </span>
          </div>
          {goingRows.length === 0 ? (
            <EmptyState message="참석 응답한 사람이 없습니다." />
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {goingRows.map((row) => (
                <li key={row.userId} className="flex items-center gap-3 p-3">
                  <Checkbox
                    id={`attend-${row.userId}`}
                    checked={!!attended[row.userId]}
                    disabled={locked}
                    onCheckedChange={(checked) =>
                      setAttended({
                        ...attended,
                        [row.userId]: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor={`attend-${row.userId}`}
                    className="flex-1 py-2 text-sm"
                  >
                    {row.name}
                  </Label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">비용</h2>
            <span className="text-sm text-muted-foreground">
              총 {formatWon(totalCost)}
            </span>
          </div>

          {expenses.length === 0 ? (
            <EmptyState message="등록된 비용이 없습니다." />
          ) : (
            <ul className="flex flex-col gap-2">
              {expenses.map((item) => {
                const count = attendeeIds.length;
                const remainder = count > 0 ? item.amount % count : 0;
                return (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="text-sm">
                      <p className="font-medium">
                        {item.name} · {formatWon(item.amount)}
                      </p>
                      <p className="text-muted-foreground">
                        결제 {nameOf(item.payer_id)}
                        {count > 0 &&
                          ` · 1인당 ${formatWon(Math.floor(item.amount / count))}`}
                        {remainder > 0 &&
                          ` (나머지 ${formatWon(remainder)}은 결제자 부담)`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0"
                      aria-label={`${item.name} 삭제`}
                      disabled={locked}
                      onClick={() =>
                        setExpenses(expenses.filter((e) => e.id !== item.id))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            onSubmit={handleSubmit(addExpense)}
            noValidate
            className="flex flex-col gap-3 rounded-lg border p-4"
          >
            <fieldset
              disabled={locked}
              className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
            >
              <p className="text-sm font-medium">비용 추가</p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-title">항목명</Label>
                <Input
                  id="expense-title"
                  className="h-11"
                  placeholder="예: 구장 대관"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError message={errors.name?.message} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-amount">금액 (원)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className="h-11"
                  aria-invalid={!!errors.amount}
                  {...register("amount", { valueAsNumber: true })}
                />
                <FieldError message={errors.amount?.message} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-payer">결제자</Label>
                <Controller
                  control={control}
                  name="payerId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="expense-payer" className="h-11">
                        <SelectValue placeholder="결제한 사람을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {goingRows.map((row) => (
                          <SelectItem key={row.userId} value={row.userId}>
                            {row.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.payerId?.message} />
              </div>
              <Button type="submit" className="h-11">
                추가
              </Button>
            </fieldset>
          </form>
        </section>
      </div>

      {/* 우측 열: 정산. 스크롤해도 보이도록 고정하되 sticky 헤더 아래에 둡니다 */}
      <section className="flex flex-col gap-3 lg:sticky lg:top-20">
        <h2 className="font-semibold">정산</h2>
        {attendeeIds.length === 0 ? (
          <EmptyState message="출석한 사람이 없어 정산할 수 없어요." />
        ) : expenses.length === 0 ? (
          <EmptyState message="비용을 추가하면 1인당 금액이 계산돼요." />
        ) : (
          <>
            {/* 모바일: 카드형 목록 */}
            <ul className="flex flex-col divide-y rounded-lg border lg:hidden">
              {totals.map((row) => (
                <li
                  key={row.user_id}
                  className="flex items-center justify-between gap-2 p-3"
                >
                  <div className="text-sm">
                    <p className="font-medium">{nameOf(row.user_id)}</p>
                    <p className="text-muted-foreground">
                      {formatWon(row.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderPayment(row.user_id, row.amount)}
                  </div>
                </li>
              ))}
            </ul>

            {/* 데스크톱: 표 */}
            <table className="hidden w-full rounded-lg border text-sm lg:table">
              <caption className="sr-only">참석자별 정산 현황</caption>
              <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    이름
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    분담액
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    입금 상태
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    <span className="sr-only">액션</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {totals.map((row) => (
                  <tr key={row.user_id}>
                    <th scope="row" className="p-3 text-left font-medium">
                      {nameOf(row.user_id)}
                    </th>
                    <td className="p-3 text-right tabular-nums">
                      {formatWon(row.amount)}
                    </td>
                    <td className="p-3">
                      {row.amount === 0 ? (
                        <span className="text-muted-foreground">
                          보낼 금액 없음
                        </span>
                      ) : (
                        <PaymentBadge
                          status={payments[row.user_id] ?? "unpaid"}
                        />
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {row.amount !== 0 && renderConfirmButton(row.user_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
