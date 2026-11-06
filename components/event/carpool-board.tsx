"use client";

import { EmptyState } from "@/components/event/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toKstIso } from "@/lib/datetime";
import { formatEventDate } from "@/lib/format";
import type {
  CarpoolPassenger,
  CarpoolRide,
  PassengerStatus,
} from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface CarpoolBoardProps {
  eventId: string;
  initialRides: CarpoolRide[];
  initialPassengers: CarpoolPassenger[];
  /** userId → 이름 */
  names: Record<string, string>;
  /** 참석(going) 중인 사용자 ID */
  goingUserIds: string[];
  myUserId: string;
}

const STATUS_LABEL: Record<PassengerStatus, string> = {
  pending: "수락 대기",
  accepted: "탑승 확정",
  rejected: "거절됨",
};

// 카풀 탭: 운행 등록, 탑승 신청, 운전자의 수락/거절, 미배정 참석자 (더미 상태, 저장되지 않음)
export function CarpoolBoard({
  eventId,
  initialRides,
  initialPassengers,
  names,
  goingUserIds,
  myUserId,
}: CarpoolBoardProps) {
  const [rides, setRides] = useState(initialRides);
  const [passengers, setPassengers] = useState(initialPassengers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [departAt, setDepartAt] = useState("");
  const [seats, setSeats] = useState("3");

  const canUse = goingUserIds.includes(myUserId);
  const iAmDriver = rides.some((ride) => ride.driver_id === myUserId);
  const myActiveApplication = passengers.some(
    (p) =>
      p.user_id === myUserId &&
      (p.status === "pending" || p.status === "accepted"),
  );

  const acceptedCount = (rideId: string) =>
    passengers.filter((p) => p.ride_id === rideId && p.status === "accepted")
      .length;

  const assigned = new Set([
    ...rides.map((ride) => ride.driver_id),
    ...passengers.filter((p) => p.status === "accepted").map((p) => p.user_id),
  ]);
  const unassigned = goingUserIds.filter((id) => !assigned.has(id));

  function addRide() {
    const seatCount = Number(seats);
    if (!origin.trim() || !departAt) {
      toast.error("출발지와 출발 시각을 입력해 주세요.");
      return;
    }
    if (!Number.isInteger(seatCount) || seatCount < 1) {
      toast.error("좌석은 1석 이상이어야 해요.");
      return;
    }
    setRides([
      ...rides,
      {
        id: `local-${rides.length + 1}-${Math.round(seatCount)}`,
        event_id: eventId,
        driver_id: myUserId,
        origin: origin.trim(),
        depart_at: toKstIso(departAt),
        seats: seatCount,
      },
    ]);
    setOrigin("");
    setDepartAt("");
    setSeats("3");
    setDialogOpen(false);
    toast.success("운행을 등록했어요.");
  }

  function apply(rideId: string) {
    setPassengers([
      ...passengers,
      { ride_id: rideId, user_id: myUserId, status: "pending" },
    ]);
    toast.success("탑승을 신청했어요. 운전자가 수락하면 확정돼요.");
  }

  function decide(rideId: string, userId: string, status: PassengerStatus) {
    const ride = rides.find((item) => item.id === rideId);
    if (status === "accepted" && ride && acceptedCount(rideId) >= ride.seats) {
      toast.error("남은 좌석이 없어 수락할 수 없어요.");
      return;
    }
    setPassengers(
      passengers.map((p) =>
        p.ride_id === rideId && p.user_id === userId ? { ...p, status } : p,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!canUse && (
        <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          참석으로 응답한 사람만 카풀을 이용할 수 있어요.
        </p>
      )}

      {canUse && !iAmDriver && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11">운행 등록하기</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>카풀 운행 등록</DialogTitle>
              <DialogDescription>
                내 차로 함께 갈 사람을 모집해요.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ride-origin">출발지</Label>
                <Input
                  id="ride-origin"
                  className="h-11"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ride-depart">출발 시각</Label>
                <Input
                  id="ride-depart"
                  type="datetime-local"
                  className="h-11"
                  value={departAt}
                  onChange={(e) => setDepartAt(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ride-seats">좌석 수</Label>
                <Input
                  id="ride-seats"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className="h-11"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button className="h-11" onClick={addRide}>
                등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {rides.length === 0 ? (
        <EmptyState message="등록된 카풀이 없습니다." />
      ) : (
        <ul className="flex flex-col gap-3">
          {rides.map((ride) => {
            const accepted = acceptedCount(ride.id);
            const remaining = ride.seats - accepted;
            const rideApplicants = passengers.filter(
              (p) => p.ride_id === ride.id,
            );
            const mine = rideApplicants.find((p) => p.user_id === myUserId);
            const isMine = ride.driver_id === myUserId;

            return (
              <li
                key={ride.id}
                className="flex flex-col gap-3 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{ride.origin}</p>
                    <p className="text-sm break-keep text-muted-foreground">
                      {formatEventDate(ride.depart_at)} 출발 · 운전{" "}
                      {names[ride.driver_id] ?? "알 수 없음"}
                    </p>
                  </div>
                  <Badge
                    variant={remaining > 0 ? "default" : "secondary"}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {remaining > 0
                      ? `남은 ${remaining}/${ride.seats}석`
                      : "만석"}
                  </Badge>
                </div>

                {accepted > 0 && (
                  <p className="text-sm">
                    탑승:{" "}
                    {rideApplicants
                      .filter((p) => p.status === "accepted")
                      .map((p) => names[p.user_id] ?? "알 수 없음")
                      .join(", ")}
                  </p>
                )}

                {isMine &&
                  rideApplicants
                    .filter((p) => p.status === "pending")
                    .map((p) => (
                      <div
                        key={p.user_id}
                        className="flex items-center justify-between gap-2 rounded-md bg-secondary p-2"
                      >
                        <span className="text-sm">
                          {names[p.user_id] ?? "알 수 없음"} 님의 신청
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-11"
                            onClick={() =>
                              decide(ride.id, p.user_id, "accepted")
                            }
                          >
                            수락
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-11"
                            onClick={() =>
                              decide(ride.id, p.user_id, "rejected")
                            }
                          >
                            거절
                          </Button>
                        </div>
                      </div>
                    ))}

                {!isMine && mine && (
                  <Badge variant="outline" className="w-fit">
                    내 신청: {STATUS_LABEL[mine.status]}
                  </Badge>
                )}
                {!isMine && !mine && canUse && (
                  <Button
                    variant="outline"
                    className="h-11"
                    disabled={
                      remaining <= 0 || iAmDriver || myActiveApplication
                    }
                    onClick={() => apply(ride.id)}
                  >
                    {remaining <= 0
                      ? "만석"
                      : myActiveApplication
                        ? "이미 신청한 운행이 있어요"
                        : "탑승 신청"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          카풀 미배정 참석자 ({unassigned.length}명)
        </h3>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            모든 참석자가 배정되었어요.
          </p>
        ) : (
          <p className="text-sm">
            {unassigned.map((id) => names[id] ?? "알 수 없음").join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
