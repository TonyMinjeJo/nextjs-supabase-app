/**
 * 로그인 후 이동 경로(`next`)를 검증합니다. (open-redirect 방어)
 * 같은 사이트 내부 경로("/"로 시작)만 허용하고, 그 외에는 fallback을 반환합니다.
 */
export function getSafeNext(
  next: string | null | undefined,
  fallback = "/protected",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("\\")) return fallback;
  if (next.includes("://")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}
