import type { Enums, Tables } from "@/lib/supabase/database.types";

/** 카풀 신청 상태 */
export type PassengerStatus = Enums<"passenger_status">;

/** 카풀 운행 (carpool_rides) */
export type CarpoolRide = Pick<
  Tables<"carpool_rides">,
  "id" | "event_id" | "driver_id" | "origin" | "depart_at" | "seats"
>;

/** 카풀 탑승 (carpool_passengers) */
export type CarpoolPassenger = Pick<
  Tables<"carpool_passengers">,
  "ride_id" | "user_id" | "status"
>;
