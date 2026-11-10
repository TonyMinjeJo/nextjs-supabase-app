"use client";

import { respondToEvent } from "@/app/(app)/events/participation-actions";
import { ParticipationBadge } from "@/components/event/participation-badge";
import { Button } from "@/components/ui/button";
import type { ParticipationStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface RsvpButtonsProps {
  /** 이벤트 공유 코드 (respond_to_event RPC의 식별자) */
  code: string;
  initialStatus: ParticipationStatus | null;
  /** initialStatus가 waitlist일 때만 1부터 */
  waitlistOrder?: number | null;
  goingCount: number;
  capacity: number;
  /** 신청 마감이 지났는지 (표시용, 실제 차단은 서버 RPC가 판단) */
  closed: boolean;
}

// 참석/불참 응답. 서버 액션(respondToEvent)으로 저장하고, 정원이 가득 차 있으면 대기로 등록됩니다.
export function RsvpButtons({
  code,
  initialStatus,
  waitlistOrder = null,
  goingCount,
  capacity,
  closed,
}: RsvpButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [order, setOrder] = useState(waitlistOrder);
  const [going, setGoing] = useState(goingCount);
  const isFull = going >= capacity;
  // 이미 대기 중이면 "정원이 가득 찼어요" 안내 대신 대기 상태를 알리고, 불참 버튼은 대기 취소 역할을 합니다.
  const isWaiting = status === "waitlist";

  function respond(next: "going" | "not_going") {
    const wasWaiting = isWaiting;
    startTransition(async () => {
      const result = await respondToEvent(code, next);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setStatus(result.data.status);
      setOrder(result.data.waitlistOrder);
      setGoing(result.data.goingCount);

      if (result.data.status === "waitlist") {
        toast("정원이 가득 차서 대기로 등록했어요.", {
          description: result.data.waitlistOrder
            ? `현재 대기 ${result.data.waitlistOrder}번이에요. 자리가 나면 순서대로 참석으로 바뀌어요.`
            : "자리가 나면 순서대로 참석으로 바뀌어요.",
        });
      } else {
        toast.success(
          result.data.status === "going"
            ? "참석으로 응답했어요."
            : wasWaiting
              ? "대기를 취소했어요."
              : "불참으로 응답했어요.",
        );
      }
      // 서버 컴포넌트(참석자 목록, 정원 게이지, 상세 링크)를 최신 상태로 갱신
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">내 응답</span>
        <ParticipationBadge
          status={status}
          waitlistOrder={order ?? undefined}
        />
      </div>
      {closed ? (
        <p className="rounded-lg bg-secondary p-3 text-center text-sm text-secondary-foreground">
          신청이 마감되었어요.
        </p>
      ) : (
        <>
          {isWaiting ? (
            <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
              {order ? `대기 ${order}번이에요. ` : "대기 중이에요. "}
              자리가 나면 자동으로 참석으로 바뀌어요.
            </p>
          ) : (
            isFull &&
            status !== "going" && (
              <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
                정원이 가득 찼어요. 참석을 누르면 대기로 등록돼요.
              </p>
            )
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-11"
              variant={status === "going" ? "default" : "outline"}
              disabled={isPending || isWaiting}
              onClick={() => respond("going")}
            >
              {isWaiting
                ? order
                  ? `대기 ${order}번`
                  : "대기 중"
                : isFull && status !== "going"
                  ? "대기 신청"
                  : "참석"}
            </Button>
            <Button
              className="h-11"
              variant={status === "not_going" ? "default" : "outline"}
              disabled={isPending}
              onClick={() => respond("not_going")}
            >
              {isWaiting ? "대기 취소" : "불참"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
