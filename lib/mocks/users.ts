import type { Profile } from "@/lib/types";

// Phase 2 더미 데이터. Phase 3에서 Supabase 쿼리로 교체합니다.

/** 화면에서 "나"로 취급하는 더미 사용자 */
export const CURRENT_USER_ID = "u1";

export const users: Profile[] = [
  { id: "u1", name: "조민제", avatar_url: null, role: "admin" },
  { id: "u2", name: "김하늘", avatar_url: null, role: "user" },
  { id: "u3", name: "이서준", avatar_url: null, role: "user" },
  { id: "u4", name: "박지우", avatar_url: null, role: "user" },
  { id: "u5", name: "최유나", avatar_url: null, role: "user" },
  { id: "u6", name: "정도윤", avatar_url: null, role: "user" },
  { id: "u7", name: "한소희", avatar_url: null, role: "user" },
  { id: "u8", name: "오민재", avatar_url: null, role: "user" },
  { id: "u9", name: "윤채원", avatar_url: null, role: "user" },
  { id: "u10", name: "강태오", avatar_url: null, role: "user" },
];

export function getUserName(userId: string): string {
  return users.find((user) => user.id === userId)?.name ?? "알 수 없음";
}

/**
 * 사용자가 운영자(admin)인지 판단합니다. 인자를 생략하면 현재 사용자(CURRENT_USER_ID) 기준입니다.
 * 더미 단계 헬퍼이며, Phase 3(Task 006)에서 실제 profiles.role 조회로 교체합니다.
 */
export function isAdmin(userId: string = CURRENT_USER_ID): boolean {
  return users.find((user) => user.id === userId)?.role === "admin";
}
