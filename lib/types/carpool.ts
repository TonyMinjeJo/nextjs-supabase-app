/** 카풀 신청 상태 */
export type PassengerStatus = "pending" | "accepted" | "rejected";

/** 카풀 운행 (carpool_rides) */
export interface CarpoolRide {
  id: string;
  event_id: string;
  driver_id: string;
  origin: string;
  depart_at: string;
  /** 좌석 수 */
  seats: number;
}

/** 카풀 탑승 (carpool_passengers) */
export interface CarpoolPassenger {
  ride_id: string;
  user_id: string;
  status: PassengerStatus;
}
