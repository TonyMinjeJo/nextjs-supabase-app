"use client";

import { setAttendance } from "@/lib/actions/participation";
import { EmptyState } from "@/components/event/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ParticipantRowProps } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface AttendanceChecklistProps {
  eventId: string;
  /** 참석(going) 확정 응답자만 */
  goingRows: ParticipantRowProps[];
}

// 출석 체크리스트. 체크 즉시 화면에 반영(낙관적 갱신)하고, 서버 저장에 실패하면 되돌립니다.
export function AttendanceChecklist({
  eventId,
  goingRows,
}: AttendanceChecklistProps) {
  const [attended, setAttended] = useState<Record<string, boolean>>(
    Object.fromEntries(goingRows.map((row) => [row.userId, row.attended])),
  );
  // 저장 중인 사용자는 중복 클릭을 막습니다.
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const attendedCount = goingRows.filter((row) => attended[row.userId]).length;

  async function toggle(userId: string, next: boolean) {
    const previous = !!attended[userId];
    setAttended((current) => ({ ...current, [userId]: next }));
    setSaving((current) => ({ ...current, [userId]: true }));

    const result = await setAttendance(eventId, userId, next);

    setSaving((current) => ({ ...current, [userId]: false }));
    if (!result.success) {
      setAttended((current) => ({ ...current, [userId]: previous }));
      toast.error(result.message);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">출석 체크</h2>
        <span className="text-sm text-muted-foreground">
          {attendedCount}/{goingRows.length}명 출석
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
                disabled={!!saving[row.userId]}
                onCheckedChange={(checked) =>
                  toggle(row.userId, checked === true)
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
  );
}
