"use server";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types/forms";
import {
  announcementIdSchema,
  createAnnouncementSchema,
  pinAnnouncementSchema,
} from "@/lib/validations/announcement";
import { z } from "zod";

// 공지 작성/고정/삭제 서버 액션. announcements는 주최자 직접 쓰기 정책(RLS)이 있어 RPC 없이 테이블을 호출합니다.
// 순서: 입력 재검증 -> 세션 확인 -> 취소 여부 확인 -> DB 호출 -> 한국어 오류 메시지
// 주의: RLS가 막은 UPDATE/DELETE는 오류가 아니라 0행이므로 영향 행 수를 확인합니다.
// 취소된 이벤트의 쓰기 차단은 이 서버 액션에만 있고 DB 정책은 막지 않습니다.

const MESSAGES = {
  unauthenticated: "로그인이 필요해요.",
  eventNotFound: "이벤트를 찾을 수 없어요.",
  announcementNotFound: "공지를 찾을 수 없어요.",
  canceled: "취소된 이벤트에는 공지를 쓰거나 바꿀 수 없어요.",
  createForbidden: "공지를 작성할 권한이 없어요.",
  changeForbidden: "공지를 바꿀 권한이 없어요.",
  createFailed: "공지를 등록하지 못했어요. 잠시 후 다시 시도해 주세요.",
  pinFailed: "공지를 고정하지 못했어요. 잠시 후 다시 시도해 주세요.",
  deleteFailed: "공지를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
} as const;

// PostgreSQL insufficient_privilege (RLS 위반)
const RLS_VIOLATION = "42501";

export async function createAnnouncement(
  eventId: string,
  body: string,
): Promise<ActionResult<null>> {
  const parsed = createAnnouncementSchema.safeParse({ eventId, body });
  if (!parsed.success) {
    return {
      success: false,
      message: "입력값을 확인해 주세요.",
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await getSessionUser();
  if (!user) return { success: false, message: MESSAGES.unauthenticated };

  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("canceled_at")
    .eq("id", parsed.data.eventId)
    .maybeSingle();
  if (eventError) return { success: false, message: MESSAGES.createFailed };
  if (!event) return { success: false, message: MESSAGES.eventNotFound };
  if (event.canceled_at) return { success: false, message: MESSAGES.canceled };

  // author_id는 입력이 아니라 항상 세션에서 가져옵니다. (RLS도 author_id = auth.uid()를 요구)
  const { error } = await supabase.from("announcements").insert({
    event_id: parsed.data.eventId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) {
    return {
      success: false,
      message:
        error.code === RLS_VIOLATION
          ? MESSAGES.createForbidden
          : MESSAGES.createFailed,
    };
  }

  return { success: true, data: null };
}

/** 취소된 이벤트의 공지인지 확인합니다. 멤버가 아니면 RLS로 조회되지 않아 not found가 됩니다. */
async function checkAnnouncementWritable(
  announcementId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, events(canceled_at)")
    .eq("id", announcementId)
    .maybeSingle();
  if (error) return { ok: false, message: MESSAGES.changeForbidden };
  if (!data) return { ok: false, message: MESSAGES.announcementNotFound };
  if (data.events?.canceled_at)
    return { ok: false, message: MESSAGES.canceled };
  return { ok: true };
}

export async function setAnnouncementPinned(
  announcementId: string,
  pinned: boolean,
): Promise<ActionResult<null>> {
  const parsed = pinAnnouncementSchema.safeParse({ announcementId, pinned });
  if (!parsed.success) {
    return {
      success: false,
      message: "입력값을 확인해 주세요.",
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await getSessionUser();
  if (!user) return { success: false, message: MESSAGES.unauthenticated };

  const writable = await checkAnnouncementWritable(parsed.data.announcementId);
  if (!writable.ok) return { success: false, message: writable.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .update({ pinned: parsed.data.pinned })
    .eq("id", parsed.data.announcementId)
    .select("id");
  if (error) return { success: false, message: MESSAGES.pinFailed };
  if (data.length === 0) {
    return { success: false, message: MESSAGES.changeForbidden };
  }

  return { success: true, data: null };
}

export async function deleteAnnouncement(
  announcementId: string,
): Promise<ActionResult<null>> {
  const parsed = announcementIdSchema.safeParse(announcementId);
  if (!parsed.success) {
    return { success: false, message: "잘못된 공지예요." };
  }

  const user = await getSessionUser();
  if (!user) return { success: false, message: MESSAGES.unauthenticated };

  const writable = await checkAnnouncementWritable(parsed.data);
  if (!writable.ok) return { success: false, message: writable.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", parsed.data)
    .select("id");
  if (error) return { success: false, message: MESSAGES.deleteFailed };
  if (data.length === 0) {
    return { success: false, message: MESSAGES.changeForbidden };
  }

  return { success: true, data: null };
}
