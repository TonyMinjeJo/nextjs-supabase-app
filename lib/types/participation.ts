/** 참석 상태 */
export type ParticipationStatus = "going" | "not_going" | "waitlist";

/** 참석 (participations) */
export interface Participation {
  event_id: string;
  user_id: string;
  status: ParticipationStatus;
  /** 출석 여부 */
  attended: boolean;
  /** 응답 시각 (대기 순번 기준: 먼저 응답한 순) */
  created_at: string;
}

/** 공지 (announcements) */
export interface Announcement {
  id: string;
  event_id: string;
  body: string;
  /** 상단 고정 */
  pinned: boolean;
  /** 작성 시각 (최신순 정렬 기준) */
  created_at: string;
}
