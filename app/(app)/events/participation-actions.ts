"use server";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ParticipationStatus } from "@/lib/types";
import type { ActionResult } from "@/lib/types/forms";
import {
  attendanceSchema,
  respondSchema,
} from "@/lib/validations/participation";
import { z } from "zod";

// 참석 응답/출석 체크 서버 액션. participations는 쓰기 정책이 없어 SECURITY DEFINER RPC로만 씁니다.
// 순서: 입력 재검증 -> 세션 확인 -> RPC -> 오류 코드를 한국어 메시지로 변환

const GENERIC_ERROR = "처리하지 못했어요. 잠시 후 다시 시도해 주세요.";

// RPC가 raise exception 하는 메시지(= 오류 코드) 매핑
const ERROR_MESSAGES: Record<string, string> = {
  unauthenticated: "로그인이 필요해요.",
  event_not_found: "이벤트를 찾을 수 없어요.",
  rsvp_closed: "참석 응답이 마감되었어요.",
  event_canceled: "취소된 이벤트예요.",
  invalid_response: "올바르지 않은 응답이에요.",
  forbidden: "주최자만 출석을 체크할 수 있어요.",
  not_going_participant: "참석 확정된 참석자만 출석을 체크할 수 있어요.",
  invalid_attended: "출석 여부가 올바르지 않아요.",
};

function mapRpcError(message: string): string {
  const code = Object.keys(ERROR_MESSAGES).find((key) => message.includes(key));
  return code ? ERROR_MESSAGES[code] : GENERIC_ERROR;
}

export interface RespondResult {
  status: ParticipationStatus;
  /** status가 waitlist일 때만 */
  waitlistOrder: number | null;
  goingCount: number;
}

export async function respondToEvent(
  code: string,
  response: string,
): Promise<ActionResult<RespondResult>> {
  const parsed = respondSchema.safeParse({ code, response });
  if (!parsed.success) {
    return {
      success: false,
      message: "입력값을 확인해 주세요.",
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await getSessionUser();
  if (!user) return { success: false, message: ERROR_MESSAGES.unauthenticated };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_to_event", {
    p_code: parsed.data.code,
    p_response: parsed.data.response,
  });
  if (error) return { success: false, message: mapRpcError(error.message) };

  const row = data?.[0];
  if (!row) return { success: false, message: GENERIC_ERROR };
  return {
    success: true,
    data: {
      status: row.status,
      // 생성 타입은 non-null로 표기하지만 대기 상태가 아니면 null입니다.
      waitlistOrder: row.waitlist_order ?? null,
      goingCount: row.going_count,
    },
  };
}

export async function setAttendance(
  eventId: string,
  userId: string,
  attended: boolean,
): Promise<ActionResult<null>> {
  const parsed = attendanceSchema.safeParse({ eventId, userId, attended });
  if (!parsed.success) {
    return {
      success: false,
      message: "입력값을 확인해 주세요.",
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await getSessionUser();
  if (!user) return { success: false, message: ERROR_MESSAGES.unauthenticated };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_attendance", {
    p_event_id: parsed.data.eventId,
    p_user_id: parsed.data.userId,
    p_attended: parsed.data.attended,
  });
  if (error) return { success: false, message: mapRpcError(error.message) };

  return { success: true, data: null };
}
