import { z } from "zod";
import { isShareCode, isUuid } from "./ids";

// 참석 응답/출석 체크 입력 스키마. 서버 액션에서 다시 검증합니다.

export const respondSchema = z.object({
  code: z.string().refine(isShareCode, "잘못된 초대 코드예요."),
  response: z.enum(["going", "not_going"], {
    error: "참석 또는 불참을 선택해 주세요.",
  }),
});

export const attendanceSchema = z.object({
  eventId: z.string().refine(isUuid, "잘못된 이벤트예요."),
  userId: z.string().refine(isUuid, "잘못된 참석자예요."),
  attended: z.boolean({ error: "출석 여부가 올바르지 않아요." }),
});

export type RespondInput = z.infer<typeof respondSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
