import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ParticipantRowProps, ParticipationStatus } from "@/lib/types";
import { isShareCode, isUuid } from "@/lib/validations/ids";

// 참석 조회 계층. 접근 제어는 RLS(이벤트 멤버/admin)가 1차입니다.
// 쿠키를 읽으므로 Suspense 안(요청 시점)에서 호출하세요.

const STATUS_ORDER: Record<ParticipationStatus, number> = {
  going: 0,
  waitlist: 1,
  not_going: 2,
};

/** 대기열 기준 정렬: created_at 오름차순, 동률은 user_id (RPC의 승급 순서와 동일) */
function compareQueue(
  a: { created_at: string; user_id: string },
  b: { created_at: string; user_id: string },
): number {
  const diff = Date.parse(a.created_at) - Date.parse(b.created_at);
  if (diff !== 0) return diff;
  return a.user_id < b.user_id ? -1 : a.user_id > b.user_id ? 1 : 0;
}

/** 참석자 목록 (참석, 대기, 불참 순). 대기 순번은 먼저 응답한 순으로 1부터 */
export async function getParticipants(
  eventId: string,
): Promise<ParticipantRowProps[]> {
  if (!isUuid(eventId)) return [];

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("participations")
    .select("user_id, status, attended, created_at")
    .eq("event_id", eventId);
  if (error) throw new Error(`참석자 조회 실패: ${error.message}`);
  if (rows.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in(
      "id",
      rows.map((row) => row.user_id),
    );
  if (profileError) {
    throw new Error(`프로필 조회 실패: ${profileError.message}`);
  }
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  let waitlistOrder = 0;
  return [...rows]
    .sort(compareQueue)
    .map((row) => {
      const profile = profileById.get(row.user_id);
      return {
        userId: row.user_id,
        // DB 컬럼은 full_name이고, 화면 모델은 name입니다. 매핑은 이 계층에서만 합니다.
        name: profile?.full_name ?? "이름 없음",
        avatarUrl: profile?.avatar_url ?? null,
        status: row.status,
        attended: row.attended,
        waitlistOrder: row.status === "waitlist" ? ++waitlistOrder : undefined,
      };
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

export interface MyParticipation {
  eventId: string;
  /** 응답 전(주최자가 아직 응답하지 않은 경우 등)이면 null */
  status: ParticipationStatus | null;
  /** status가 waitlist일 때만 1부터 */
  waitlistOrder: number | null;
}

/**
 * share_code로 내 참석 상태 조회.
 * 이벤트를 볼 수 없거나(RLS), 주최자도 참여자도 아니면(admin 포함) null
 */
export async function getMyParticipationByCode(
  code: string,
): Promise<MyParticipation | null> {
  if (!isShareCode(code)) return null;
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, host_id")
    .eq("share_code", code)
    .maybeSingle();
  if (error) throw new Error(`이벤트 조회 실패: ${error.message}`);
  if (!event) return null;

  // admin은 모든 행을 볼 수 있으므로 user_id로 직접 한정합니다.
  const { data: mine, error: mineError } = await supabase
    .from("participations")
    .select("status")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (mineError) throw new Error(`참석 조회 실패: ${mineError.message}`);

  if (!mine) {
    return event.host_id === user.id
      ? { eventId: event.id, status: null, waitlistOrder: null }
      : null;
  }

  let waitlistOrder: number | null = null;
  if (mine.status === "waitlist") {
    const { data: queue, error: queueError } = await supabase
      .from("participations")
      .select("user_id, created_at")
      .eq("event_id", event.id)
      .eq("status", "waitlist");
    if (queueError) throw new Error(`대기열 조회 실패: ${queueError.message}`);
    const index = [...queue]
      .sort(compareQueue)
      .findIndex((row) => row.user_id === user.id);
    waitlistOrder = index >= 0 ? index + 1 : null;
  }

  return { eventId: event.id, status: mine.status, waitlistOrder };
}
