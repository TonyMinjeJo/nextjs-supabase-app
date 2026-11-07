import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

// 로그인 상태일 때만 로그아웃 버튼을 보여줍니다. (공개 페이지 헤더용)
// 동적 접근(쿠키)이 있으므로 호출처에서 <Suspense>로 감싸야 합니다.
export async function SignedInLogout() {
  if (!hasEnvVars) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) return null;

  return <LogoutButton />;
}
