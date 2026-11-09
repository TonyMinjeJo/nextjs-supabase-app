import type { Tables } from "@/lib/supabase/database.types";

/** 반복 규칙 (event_series). weekday: 0=일 ~ 6=토, end_date: YYYY-MM-DD */
export type EventSeries = Pick<
  Tables<"event_series">,
  "id" | "host_id" | "weekday" | "end_date"
>;

/**
 * 이벤트 (events). DB Row에서 화면이 쓰는 필드만 파생합니다.
 * transfer_account는 주최자·참여자·admin에게만 노출되므로 별도 경로로 다룹니다.
 * share_code는 공유 링크 코드(unique)입니다.
 */
export type MeetupEvent = Pick<
  Tables<"events">,
  | "id"
  | "host_id"
  | "series_id"
  | "title"
  | "description"
  | "starts_at"
  | "location"
  | "capacity"
  | "rsvp_deadline"
  | "share_code"
  | "cover_image_path"
  | "canceled_at"
>;
