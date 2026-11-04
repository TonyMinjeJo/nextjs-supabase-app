import { sortAnnouncements } from "@/lib/announcements";
import type { Announcement } from "@/lib/types";

export const announcements: Announcement[] = [
  {
    id: "a1",
    event_id: "e1",
    body: "구장이 B코트로 변경되었습니다. 입구에서 만나요!",
    pinned: true,
    created_at: "2026-11-10T10:00:00+09:00",
  },
  {
    id: "a2",
    event_id: "e1",
    body: "실내화와 개인 물을 꼭 챙겨 주세요.",
    pinned: false,
    created_at: "2026-11-09T09:00:00+09:00",
  },
  {
    id: "a3",
    event_id: "e2",
    body: "집결 시간은 8시 40분입니다. 카풀 신청은 이 앱에서 해 주세요.",
    pinned: true,
    created_at: "2026-11-15T09:00:00+09:00",
  },
];

/** 고정 공지 우선, 그 안에서는 작성 시각 최신순 */
export function getAnnouncements(eventId: string): Announcement[] {
  return sortAnnouncements(
    announcements.filter((item) => item.event_id === eventId),
  );
}
