"use client";

import { ParticipationBadge } from "@/components/event/participation-badge";
import { Button } from "@/components/ui/button";
import type { ParticipationStatus } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface RsvpButtonsProps {
  initialStatus: ParticipationStatus | null;
  goingCount: number;
  capacity: number;
  /** 신청 마감이 지났는지 (UI 안내용, 실제 차단은 Phase 3 서버에서) */
  closed: boolean;
}

// 참석/불참 응답. 정원이 가득 차 있으면 대기로 등록됩니다. (더미 상태, 저장되지 않음)
export function RsvpButtons({
  initialStatus,
  goingCount,
  capacity,
  closed,
}: RsvpButtonsProps) {
  const [status, setStatus] = useState(initialStatus);
  const isFull = goingCount >= capacity;

  function respond(next: "going" | "not_going") {
    if (next === "going" && status !== "going" && isFull) {
      setStatus("waitlist");
      toast("정원이 가득 차서 대기로 등록했어요.", {
        description: "자리가 나면 순서대로 참석으로 바뀌어요.",
      });
      return;
    }
    setStatus(next);
    toast.success(
      next === "going" ? "참석으로 응답했어요." : "불참으로 응답했어요.",
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">내 응답</span>
        <ParticipationBadge status={status} />
      </div>
      {closed ? (
        <p className="rounded-lg bg-secondary p-3 text-center text-sm text-secondary-foreground">
          신청이 마감되었어요.
        </p>
      ) : (
        <>
          {isFull && status !== "going" && (
            <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
              정원이 가득 찼어요. 참석을 누르면 대기로 등록돼요.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-11"
              variant={status === "going" ? "default" : "outline"}
              onClick={() => respond("going")}
            >
              {isFull && status !== "going" ? "대기 신청" : "참석"}
            </Button>
            <Button
              className="h-11"
              variant={status === "not_going" ? "default" : "outline"}
              onClick={() => respond("not_going")}
            >
              불참
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
