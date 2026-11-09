// 시각 처리 규칙: 서비스는 한국 시간(KST, +09:00)을 기준으로 합니다.
// 폼의 <input type="datetime-local"> 값은 시간대가 없는 "YYYY-MM-DDTHH:mm"이므로
// 서버에 보내거나 저장하기 전에 toKstIso()로 ISO 8601(+09:00)로 변환합니다.

export const KST_OFFSET = "+09:00";

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** "2026-11-13T19:00" → "2026-11-13T19:00:00+09:00" */
export function toKstIso(localDateTime: string): string {
  if (!LOCAL_DATE_TIME_PATTERN.test(localDateTime)) {
    throw new Error(`올바른 일시 형식이 아닙니다: ${localDateTime}`);
  }
  return `${localDateTime}:00${KST_OFFSET}`;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** timestamptz ISO → datetime-local 값. "2026-11-13T10:00:00Z" → "2026-11-13T19:00" (KST) */
export function toKstLocal(iso: string): string {
  return new Date(Date.parse(iso) + KST_OFFSET_MS).toISOString().slice(0, 16);
}
