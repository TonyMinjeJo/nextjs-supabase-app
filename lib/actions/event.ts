"use server";

import { getSessionUser } from "@/lib/auth/session";
import { toKstIso } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import type { ActionFailure, ActionResult } from "@/lib/types/forms";
import { eventFormSchema } from "@/lib/validations/event";
import { isUuid } from "@/lib/validations/ids";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 이벤트 생성/수정 서버 액션. 클라이언트와 같은 스키마로 서버에서 다시 검증합니다.
// host_id는 입력이 아니라 세션에서만 가져오며, 권한은 RLS(호스트만 INSERT/UPDATE)가 최종 방어선입니다.

const RECURRENCE_UNSUPPORTED =
  "주간 반복 이벤트는 아직 지원하지 않아요. 반복을 끄고 다시 시도해 주세요.";

const COVER_BUCKET = "event-covers";

function parseInput(
  input: unknown,
  userId: string,
):
  | {
      ok: true;
      values: {
        title: string;
        description: string | null;
        starts_at: string;
        location: string;
        capacity: number;
        rsvp_deadline: string | null;
        cover_image_path: string | null;
      };
    }
  | { ok: false; result: ActionFailure } {
  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      result: {
        success: false,
        message: "입력값을 확인해 주세요.",
        errors: z.flattenError(parsed.error).fieldErrors,
      },
    };
  }
  const value = parsed.data;
  if (value.recurrence) {
    return {
      ok: false,
      result: { success: false, message: RECURRENCE_UNSUPPORTED },
    };
  }
  const coverPath = value.coverImagePath ? value.coverImagePath : null;
  // 클라이언트가 보낸 경로는 신뢰하지 않습니다. 반드시 내 폴더의 파일이어야 합니다.
  if (coverPath && !coverPath.startsWith(`${userId}/`)) {
    return {
      ok: false,
      result: {
        success: false,
        message: "입력값을 확인해 주세요.",
        errors: { coverImagePath: ["올바른 이미지 경로가 아닙니다."] },
      },
    };
  }
  return {
    ok: true,
    values: {
      cover_image_path: coverPath,
      title: value.title,
      description: value.description ? value.description : null,
      starts_at: toKstIso(value.startsAt),
      location: value.location,
      capacity: value.capacity,
      rsvp_deadline: value.rsvpDeadline ? toKstIso(value.rsvpDeadline) : null,
    },
  };
}

export async function createEvent(
  input: unknown,
): Promise<ActionResult<{ id: string; share_code: string }>> {
  const user = await getSessionUser();
  if (!user) return { success: false, message: "로그인이 필요해요." };

  const parsed = parseInput(input, user.id);
  if (!parsed.ok) return parsed.result;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...parsed.values, host_id: user.id })
    .select("id, share_code")
    .single();
  if (error || !data) {
    return {
      success: false,
      message: "이벤트를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
  return { success: true, data };
}

export async function updateEvent(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (!isUuid(id)) return { success: false, message: "잘못된 이벤트예요." };

  const user = await getSessionUser();
  if (!user) return { success: false, message: "로그인이 필요해요." };

  const parsed = parseInput(input, user.id);
  if (!parsed.ok) return parsed.result;

  const supabase = await createClient();
  // 이전 커버 경로는 update 전에 호스트 조건으로 조회합니다. (교체/제거 시 파일 정리용)
  const { data: before } = await supabase
    .from("events")
    .select("cover_image_path, canceled_at")
    .eq("id", id)
    .eq("host_id", user.id)
    .maybeSingle();
  // 취소된 이벤트는 수정할 수 없습니다. (취소를 되돌리는 기능은 없음)
  if (before?.canceled_at) {
    return { success: false, message: "취소된 이벤트는 수정할 수 없어요." };
  }
  const previousPath = before?.cover_image_path ?? null;

  // RLS로 막힌 UPDATE는 오류 없이 0행이 되므로, 반환된 행으로 성공 여부를 확인합니다.
  const { data, error } = await supabase
    .from("events")
    .update(parsed.values)
    .eq("id", id)
    .eq("host_id", user.id)
    .select("id");
  if (error) {
    return {
      success: false,
      message: "이벤트를 수정하지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
  if (data.length === 0) {
    return { success: false, message: "이벤트를 수정할 권한이 없어요." };
  }

  // 커버가 바뀌었거나 제거됐으면 이전 파일을 지웁니다. 실패해도 저장은 성공으로 처리합니다.
  if (previousPath && previousPath !== parsed.values.cover_image_path) {
    try {
      await supabase.storage.from(COVER_BUCKET).remove([previousPath]);
    } catch {
      // best-effort
    }
  }
  return { success: true, data: { id } };
}

// 취소/삭제는 SECURITY DEFINER RPC로만 수행합니다. (events 직접 DELETE 권한은 회수됨)
// RPC가 raise exception 하는 메시지(= 오류 코드)를 한국어로 변환합니다.
const GENERIC_ERROR = "처리하지 못했어요. 잠시 후 다시 시도해 주세요.";

const CANCEL_DELETE_ERRORS: Record<string, string> = {
  unauthenticated: "로그인이 필요해요.",
  not_host: "주최자만 할 수 있어요.",
  settlement_in_progress:
    "비용이나 정산 내역이 있어 취소하거나 삭제할 수 없어요.",
  already_canceled: "이미 취소된 이벤트예요.",
  not_canceled: "취소된 이벤트만 삭제할 수 있어요.",
};

function mapCancelDeleteError(message: string): string {
  const code = Object.keys(CANCEL_DELETE_ERRORS).find((key) =>
    message.includes(key),
  );
  return code ? CANCEL_DELETE_ERRORS[code] : GENERIC_ERROR;
}

export async function cancelEvent(
  eventId: string,
): Promise<ActionResult<null>> {
  if (!isUuid(eventId))
    return { success: false, message: "잘못된 이벤트예요." };

  const user = await getSessionUser();
  if (!user)
    return { success: false, message: CANCEL_DELETE_ERRORS.unauthenticated };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event", { p_event_id: eventId });
  if (error) {
    return { success: false, message: mapCancelDeleteError(error.message) };
  }

  revalidatePath("/events");
  return { success: true, data: null };
}

export async function deleteEvent(
  eventId: string,
): Promise<ActionResult<null>> {
  if (!isUuid(eventId))
    return { success: false, message: "잘못된 이벤트예요." };

  const user = await getSessionUser();
  if (!user)
    return { success: false, message: CANCEL_DELETE_ERRORS.unauthenticated };

  const supabase = await createClient();
  // 취소된 이벤트만 삭제됩니다. 반환값은 지워진 이벤트의 커버 이미지 경로입니다.
  const { data: coverPath, error } = await supabase.rpc("delete_event", {
    p_event_id: eventId,
  });
  if (error) {
    return { success: false, message: mapCancelDeleteError(error.message) };
  }

  // 커버 파일 정리. 이미 이벤트가 삭제됐으므로 실패해도 삭제는 성공으로 처리합니다.
  if (coverPath) {
    try {
      await supabase.storage.from(COVER_BUCKET).remove([coverPath]);
    } catch {
      // best-effort
    }
  }

  revalidatePath("/events");
  return { success: true, data: null };
}
