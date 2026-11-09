import { createClient } from "@/lib/supabase/server";
import type { Announcement } from "@/lib/types";
import { isUuid } from "@/lib/validations/ids";

// 공지 조회 계층. 접근 제어는 RLS(주최자 또는 응답한 참여자, admin)가 담당하며
// 멤버가 아니면 빈 배열이 반환됩니다. 쿠키를 읽으므로 Suspense 안에서 호출하세요.

const ANNOUNCEMENT_COLUMNS = "id, event_id, body, pinned, created_at";

/** 공지 목록: 고정 공지 우선, 그다음 최신순 (인덱스 event_id, pinned desc, created_at desc) */
export async function getAnnouncements(
  eventId: string,
): Promise<Announcement[]> {
  if (!isUuid(eventId)) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .eq("event_id", eventId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`공지 조회 실패: ${error.message}`);

  return data;
}
