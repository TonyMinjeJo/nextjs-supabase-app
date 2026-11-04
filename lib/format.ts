// 화면 표시용 포맷 헬퍼. 서버/클라이언트 렌더 결과가 같도록 시간대를 고정합니다.
const TIME_ZONE = "Asia/Seoul";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** ISO 문자열을 "11월 14일 (금) 19:00" 형태로 표시합니다. */
export function formatEventDate(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** 정수 원 단위 금액을 "12,500원"으로 표시합니다. */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
