import type { Profile } from "@/lib/types";

// Phase 2 더미 데이터. Phase 3에서 Supabase 쿼리로 교체합니다.

/** 화면에서 "나"로 취급하는 더미 사용자 */
export const CURRENT_USER_ID = "u1";

export const users: Profile[] = [
  { id: "u1", name: "조민제", avatar_url: null },
  { id: "u2", name: "김하늘", avatar_url: null },
  { id: "u3", name: "이서준", avatar_url: null },
  { id: "u4", name: "박지우", avatar_url: null },
  { id: "u5", name: "최유나", avatar_url: null },
  { id: "u6", name: "정도윤", avatar_url: null },
  { id: "u7", name: "한소희", avatar_url: null },
  { id: "u8", name: "오민재", avatar_url: null },
  { id: "u9", name: "윤채원", avatar_url: null },
  { id: "u10", name: "강태오", avatar_url: null },
];

export function getUserName(userId: string): string {
  return users.find((user) => user.id === userId)?.name ?? "알 수 없음";
}
