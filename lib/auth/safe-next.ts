/** 로그인 후 기본 이동 경로 (내 이벤트) */
export const DEFAULT_AFTER_LOGIN = "/events";

/**
 * 로그인 후 이동 경로(`next`)를 검증합니다. (open-redirect 방어)
 * 같은 사이트 내부 경로("/"로 시작)만 허용하고, 그 외에는 fallback을 반환합니다.
 */
export function getSafeNext(
  next: unknown,
  fallback = DEFAULT_AFTER_LOGIN,
): string {
  // searchParams는 ?next=a&next=b 처럼 배열일 수 있으므로 문자열만 허용합니다.
  if (typeof next !== "string" || !next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("\\")) return fallback;
  if (next.includes("://")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}
