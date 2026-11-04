"use client";

import { EmptyState } from "@/components/event/empty-state";
import { PaymentBadge } from "@/components/event/payment-badge";
import { Button } from "@/components/ui/button";
import { formatWon } from "@/lib/format";
import type { PaymentStatus, SettlementRowProps } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface SettlementPanelProps {
  rows: SettlementRowProps[];
  /** 송금 안내 계좌 (참여자에게만 보여줍니다) */
  account: string | null;
  isHost: boolean;
  myUserId: string;
  manageHref: string;
  hasExpenses: boolean;
}

// 정산 탭. 참여자는 내 분담액과 송금 계좌를 보고 "입금했어요"를 표시합니다. (더미 상태)
export function SettlementPanel({
  rows,
  account,
  isHost,
  myUserId,
  manageHref,
  hasExpenses,
}: SettlementPanelProps) {
  const [status, setStatus] = useState<PaymentStatus | null>(
    rows.find((row) => row.userId === myUserId)?.paymentStatus ?? null,
  );

  if (!hasExpenses) {
    return <EmptyState message="정산 내역이 없습니다." />;
  }

  if (isHost) {
    const done = rows.filter((row) => row.paymentStatus === "confirmed").length;
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border p-4 text-sm">
          입금 확인 {done}/{rows.length}명. 비용 입력과 입금 확인은 정산
          관리에서 해요.
        </p>
        <Button asChild className="h-11">
          <Link href={manageHref}>정산 관리로 이동</Link>
        </Button>
      </div>
    );
  }

  const myRow = rows.find((row) => row.userId === myUserId);
  if (!myRow || status === null) {
    return (
      <EmptyState message="출석한 참석자만 정산 대상이에요. 내 분담액이 없습니다." />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">내가 보낼 금액</p>
        <p className="text-2xl font-bold">{formatWon(myRow.amount)}</p>
        <div className="w-fit">
          <PaymentBadge status={status} />
        </div>
      </div>
      {account && (
        <div className="flex flex-col gap-1 rounded-lg bg-secondary p-4">
          <p className="text-sm text-muted-foreground">송금 계좌</p>
          <p className="text-sm font-medium">{account}</p>
        </div>
      )}
      {status === "unpaid" && myRow.amount > 0 && (
        <Button
          className="h-11"
          onClick={() => {
            setStatus("marked");
            toast.success("입금 표시를 했어요. 주최자가 확인하면 완료돼요.");
          }}
        >
          입금했어요
        </Button>
      )}
    </div>
  );
}
