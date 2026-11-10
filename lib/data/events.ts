import { getSessionUser } from "@/lib/auth/session";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import type { EventCardProps, MeetupEvent } from "@/lib/types";
import { isShareCode, isUuid } from "@/lib/validations/ids";
import { cache } from "react";

// 이벤트 조회 계층. 접근 제어는 RLS(호스트/멤버/admin)가 1차이고, 여기서는 형식 검증과
// 도메인 타입 변환만 합니다. 쿠키를 읽으므로 Suspense 안(요청 시점)에서 호출하세요.

const EVENT_COLUMNS =
  "id, host_id, series_id, title, description, starts_at, location, capacity, rsvp_deadline, share_code, cover_image_path, canceled_at";

/** 내가 주최했거나 참여(응답)한 이벤트. 참석 인원과 내 상태 포함 */
export async function getMyEvents(): Promise<EventCardProps[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createClient();
  // admin은 RLS상 모든 행을 볼 수 있으므로 user_id/host_id로 직접 한정합니다.
  const { data: mine, error: mineError } = await supabase
    .from("participations")
    .select("event_id, status")
    .eq("user_id", user.id);
  if (mineError) throw new Error(`참석 조회 실패: ${mineError.message}`);

  const myStatusByEvent = new Map(
    mine.map((row) => [row.event_id, row.status]),
  );
  const participatedIds = [...myStatusByEvent.keys()];

  const filter = [`host_id.eq.${user.id}`];
  if (participatedIds.length > 0) {
    filter.push(`id.in.(${participatedIds.join(",")})`);
  }
  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, host_id, title, starts_at, location, capacity, share_code, cover_image_path, canceled_at",
    )
    .or(filter.join(","))
    .order("starts_at", { ascending: false });
  if (error) throw new Error(`이벤트 목록 조회 실패: ${error.message}`);
  if (events.length === 0) return [];

  // 목록의 이벤트는 모두 내가 멤버이므로 RLS상 going 행을 볼 수 있습니다.
  const { data: going, error: goingError } = await supabase
    .from("participations")
    .select("event_id")
    .eq("status", "going")
    .in(
      "event_id",
      events.map((event) => event.id),
    );
  if (goingError) throw new Error(`참석 인원 조회 실패: ${goingError.message}`);

  const goingCounts = new Map<string, number>();
  for (const row of going) {
    goingCounts.set(row.event_id, (goingCounts.get(row.event_id) ?? 0) + 1);
  }

  return events.map(({ host_id, ...event }) => ({
    event,
    goingCount: goingCounts.get(event.id) ?? 0,
    isHost: host_id === user.id,
    myStatus: myStatusByEvent.get(event.id) ?? null,
  }));
}

/** 이벤트 단건. 형식이 잘못됐거나 볼 권한이 없으면(RLS) null */
export async function getEvent(id: string): Promise<MeetupEvent | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`이벤트 조회 실패: ${error.message}`);
  return data;
}

/** 공개 초대 요약. host_id, transfer_account, 참석자 목록은 포함되지 않습니다. */
export interface EventInvite {
  title: string;
  description: string | null;
  starts_at: string;
  location: string;
  capacity: number;
  rsvp_deadline: string | null;
  host_name: string | null;
  going_count: number;
  /** 주최자가 취소한 이벤트인지 (취소되면 응답할 수 없음) */
  canceled: boolean;
}

/**
 * share_code로 공개 초대 요약 조회 (get_event_invite RPC). 없으면 null
 * 같은 요청 안에서 페이지와 generateMetadata가 함께 부르므로 cache()로 한 번만 조회합니다.
 */
export const getEventInvite = cache(
  async (code: string): Promise<EventInvite | null> => {
    if (!isShareCode(code)) return null;

    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc("get_event_invite", {
      p_code: code,
    });
    if (error) throw new Error(`초대 조회 실패: ${error.message}`);

    const row = data?.[0];
    if (!row) return null;
    // 생성 타입은 description/rsvp_deadline을 non-null로 표기하지만 실제 컬럼은 nullable입니다.
    return {
      title: row.title,
      description: row.description ?? null,
      starts_at: row.starts_at,
      location: row.location,
      capacity: row.capacity,
      rsvp_deadline: row.rsvp_deadline ?? null,
      host_name: row.host_name ?? null,
      going_count: row.going_count,
      canceled: row.canceled,
    };
  },
);
