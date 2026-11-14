import "server-only";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";
import { isUuid } from "@/lib/validations/ids";
import { cache } from "react";

// 프로필 조회 계층. 접근 제어는 RLS(profiles_select_scoped: 본인 / 같은 이벤트 멤버 / admin)가
// 1차이고, 여기서는 형식 검증과 도메인 타입 변환만 합니다.
// 쿠키를 읽으므로 Suspense 안(요청 시점)에서 호출하세요. ("use cache" 범위 안에서는 호출하지 않습니다.)

const PROFILE_COLUMNS = "id, username, full_name, avatar_url, bio, created_at";

/** 표시 이름을 구하지 못했을 때의 문구 (participations 조회와 같은 문구) */
const FALLBACK_NAME = "이름 없음";

/**
 * 표시 이름: 닉네임(username)이 있으면 그것, 없으면 가입 때 들어간 full_name, 둘 다 없으면 안내 문구.
 * 닉네임을 아직 정하지 않은 사용자도 이름이 비지 않게 하는 규칙을 한 곳에 둡니다.
 */
export function getDisplayName(
  profile: Pick<UserProfile, "username" | "full_name"> | null | undefined,
): string {
  return profile?.username ?? profile?.full_name ?? FALLBACK_NAME;
}

/** 내 프로필. 비로그인이거나 프로필 행이 없으면 null. 요청 안에서 한 번만 조회합니다. */
export const getMyProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`프로필 조회 실패: ${error.message}`);
  return data;
});

/** 프로필 단건. 형식이 잘못됐거나 볼 권한이 없으면(RLS) null */
export async function getProfile(id: string): Promise<UserProfile | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`프로필 조회 실패: ${error.message}`);
  return data;
}
