// Supabase 공개 환경 변수를 검증해 반환합니다. 없으면 변수 이름을 담은 오류를 던집니다. (값은 출력하지 않음)
// NEXT_PUBLIC_* 는 빌드 시점에 리터럴 `process.env.NEXT_PUBLIC_X` 접근만 치환되므로
// 동적 접근(process.env[name])을 쓰지 말고 아래처럼 직접 읽어야 합니다.
export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) {
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다: ${missing.join(", ")}`,
    );
  }
  return { url, key };
}
