import { createClient } from "@/lib/supabase/server";

// 커버 이미지 서명 URL 조회. 버킷이 비공개이므로 표시할 때마다 서명 URL을 발급합니다.
// 서버 클라이언트가 쿠키를 읽으므로 <Suspense> 안(요청 시점)에서만 호출하세요.
// "use cache" 범위 안에서는 호출하지 않습니다. (Cache Components)

/** 서명 URL 유효 시간(초) */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * 경로 목록 → 서명 URL 맵. 권한이 없거나 파일이 없는 경로는 맵에 없습니다.
 * 표시용 부가 기능이므로 실패해도 예외를 던지지 않고 빈 결과로 둡니다.
 */
export async function getCoverUrls(
  paths: ReadonlyArray<string | null | undefined>,
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((path): path is string => !!path))];
  if (unique.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("event-covers")
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return {};

  const urls: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) {
      urls[item.path] = item.signedUrl;
    }
  }
  return urls;
}

/** 단건 편의 함수 */
export async function getCoverUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const urls = await getCoverUrls([path]);
  return urls[path] ?? null;
}
