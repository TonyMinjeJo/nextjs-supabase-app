// 도메인 타입 초안 (docs/PRD.md 데이터 모델 기준)
// Task 005-1 UI 검토 후 확정되며, DB 타입 정합화는 Task 006에서 진행합니다.
// 날짜/시각은 ISO 8601 문자열, id는 UUID 문자열로 표현합니다.

/** 사용자 프로필 (profiles) */
export interface Profile {
  /** auth.users.id */
  id: string;
  name: string;
  avatar_url: string | null;
}
