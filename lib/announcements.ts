import type { Announcement } from "@/lib/types";

/** 고정 공지 우선, 그 안에서는 작성 시각 최신순 (PRD F003) */
export function sortAnnouncements(items: Announcement[]): Announcement[] {
  return [...items].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      Date.parse(b.created_at) - Date.parse(a.created_at),
  );
}
