"use client";

import { cancelEvent, deleteEvent } from "@/app/(app)/events/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/types/forms";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface ConfirmActionButtonProps {
  eventId: string;
  className?: string;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  action: (eventId: string) => Promise<ActionResult<null>>;
  /** 성공 후 이동할 경로. 없으면 현재 화면을 새로고침합니다. */
  redirectTo?: string;
}

// 주최자 전용 위험 동작(취소/삭제)의 공통 확인 Dialog.
// 처리 중에는 닫기·재시도를 막고, 실패하면 서버 메시지를 토스트로 보여 줍니다.
function ConfirmActionButton({
  eventId,
  className,
  triggerLabel,
  title,
  description,
  confirmLabel,
  successMessage,
  action,
  redirectTo,
}: ConfirmActionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await action(eventId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(successMessage);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      // 처리 중에는 바깥 클릭/ESC로 닫히지 않게 합니다.
      onOpenChange={(next) => {
        if (!isPending) setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-11 text-destructive hover:text-destructive",
            className,
          )}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              돌아가기
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "처리 중..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 이벤트 취소: 이벤트는 남고 "취소됨"으로 표시되며 더 이상 응답을 받지 않습니다.
export function CancelEventButton({
  eventId,
  className,
}: {
  eventId: string;
  className?: string;
}) {
  return (
    <ConfirmActionButton
      eventId={eventId}
      className={className}
      triggerLabel="이벤트 취소"
      title="이벤트를 취소할까요?"
      description="취소하면 참석 응답과 출석 체크를 더 이상 받을 수 없고, 되돌릴 수 없어요. 비용이나 정산 내역이 있으면 취소할 수 없어요."
      confirmLabel="이벤트 취소"
      successMessage="이벤트를 취소했어요."
      action={cancelEvent}
    />
  );
}

// 이벤트 삭제: 취소된 이벤트만 가능하며 참석·공지·카풀 등 연결된 데이터가 함께 지워집니다.
export function DeleteEventButton({
  eventId,
  className,
}: {
  eventId: string;
  className?: string;
}) {
  return (
    <ConfirmActionButton
      eventId={eventId}
      className={className}
      triggerLabel="이벤트 삭제"
      title="이벤트를 완전히 삭제할까요?"
      description="참석 응답, 공지, 카풀 등 이 이벤트의 모든 데이터가 지워지고 되돌릴 수 없어요."
      confirmLabel="완전히 삭제"
      successMessage="이벤트를 삭제했어요."
      action={deleteEvent}
      redirectTo="/events"
    />
  );
}
