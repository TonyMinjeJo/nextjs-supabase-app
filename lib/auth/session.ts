import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { cache } from "react";

// 서버 측 세션 조회. 요청 안에서 한 번만 실행되도록 cache()로 감쌉니다.
// Supabase 클라이언트는 전역에 저장하지 않고 호출마다 새로 만듭니다. (Fluid Compute)
// 쿠키를 읽으므로 Suspense 안(요청 시점)에서만 호출하세요. (Cache Components)

export interface SessionUser {
  /** auth.users.id (JWT claims의 sub) */
  id: string;
}

/** 로그인한 사용자. 비로그인이거나 환경 변수가 없으면 null */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!hasEnvVars) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return sub ? { id: sub } : null;
});

/** 현재 사용자가 admin인지 (profiles.role 기준). 비로그인은 false */
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getSessionUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return data?.role === "admin";
});
