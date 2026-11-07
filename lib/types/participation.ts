import type { Enums, Tables } from "@/lib/supabase/database.types";

/** 참석 상태 */
export type ParticipationStatus = Enums<"participation_status">;

/** 참석 (participations). created_at은 대기 순번 기준(먼저 응답한 순)입니다. */
export type Participation = Tables<"participations">;

/** 공지 (announcements). 목 데이터는 author_id 없이 사용합니다. */
export type Announcement = Pick<
  Tables<"announcements">,
  "id" | "event_id" | "body" | "pinned" | "created_at"
>;
