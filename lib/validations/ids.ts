// 라우트 파라미터 형식 검증. 형식이 맞지 않으면 DB를 조회하지 않고 notFound로 처리합니다.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// events.share_code 기본값: base64url(9바이트) = 12자 (패딩 없음)
const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{12}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isShareCode(value: unknown): value is string {
  return typeof value === "string" && SHARE_CODE_PATTERN.test(value);
}
