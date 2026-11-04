import type { CarpoolPassenger, CarpoolRide, RideCardProps } from "@/lib/types";
import { getParticipations } from "./participations";
import { getUserName } from "./users";

export const rides: CarpoolRide[] = [
  {
    id: "r1",
    event_id: "e2",
    driver_id: "u2",
    origin: "강남역 10번 출구",
    depart_at: "2026-11-21T07:30:00+09:00",
    seats: 3,
  },
  {
    id: "r2",
    event_id: "e2",
    driver_id: "u4",
    origin: "잠실역 8번 출구",
    depart_at: "2026-11-21T07:50:00+09:00",
    seats: 2,
  },
  {
    id: "r3",
    event_id: "e1",
    driver_id: "u1",
    origin: "왕십리역 2번 출구",
    depart_at: "2026-11-13T18:20:00+09:00",
    seats: 3,
  },
];

export const passengers: CarpoolPassenger[] = [
  { ride_id: "r1", user_id: "u3", status: "accepted" },
  { ride_id: "r1", user_id: "u1", status: "pending" },
  { ride_id: "r2", user_id: "u5", status: "accepted" },
  { ride_id: "r3", user_id: "u2", status: "accepted" },
];

export function getPassengers(rideId: string): CarpoolPassenger[] {
  return passengers.filter((item) => item.ride_id === rideId);
}

export function getRideCards(eventId: string): RideCardProps[] {
  return rides
    .filter((ride) => ride.event_id === eventId)
    .map((ride) => {
      const acceptedCount = getPassengers(ride.id).filter(
        (item) => item.status === "accepted",
      ).length;
      return {
        ride,
        driverName: getUserName(ride.driver_id),
        acceptedCount,
        remainingSeats: ride.seats - acceptedCount,
      };
    });
}

/** 카풀 미배정 참석자: 참석(going)이면서 운전자도 수락된 탑승자도 아닌 사람 */
export function getUnassignedUserIds(eventId: string): string[] {
  const eventRides = rides.filter((ride) => ride.event_id === eventId);
  const rideIds = new Set(eventRides.map((ride) => ride.id));
  const assigned = new Set<string>([
    ...eventRides.map((ride) => ride.driver_id),
    ...passengers
      .filter((p) => rideIds.has(p.ride_id) && p.status === "accepted")
      .map((p) => p.user_id),
  ]);
  return getParticipations(eventId)
    .filter((item) => item.status === "going" && !assigned.has(item.user_id))
    .map((item) => item.user_id);
}
