/** 반복 규칙 (event_series) */
export interface EventSeries {
  id: string;
  host_id: string;
  /** 반복 요일 (0=일 ~ 6=토) */
  weekday: number;
  /** 반복 종료일 (YYYY-MM-DD) */
  end_date: string;
}

/** 이벤트 (events) */
export interface Event {
  id: string;
  host_id: string;
  series_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  location: string;
  /** 정원 */
  capacity: number;
  /** 신청 마감 시각 */
  rsvp_deadline: string | null;
  /** 공유 링크 코드 (unique) */
  share_code: string;
}
