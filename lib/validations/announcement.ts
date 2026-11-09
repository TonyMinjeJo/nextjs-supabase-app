import { z } from "zod";
import { isUuid } from "./ids";

// 공지 입력 스키마. 폼(클라이언트)과 서버 액션이 같은 규칙을 씁니다.
// 길이 제한은 서버 검증만 있고 DB CHECK는 없습니다. (DB에는 빈 문자열 방지 CHECK만 있음)

export const ANNOUNCEMENT_MAX_LENGTH = 1000;

export const announcementBodySchema = z
  .string({ error: "공지 내용을 입력해 주세요." })
  .trim()
  .min(1, "공지 내용을 입력해 주세요.")
  .max(
    ANNOUNCEMENT_MAX_LENGTH,
    `공지는 ${ANNOUNCEMENT_MAX_LENGTH}자 이하로 입력해 주세요.`,
  );

/** 공지 작성 폼 */
export const announcementFormSchema = z.object({
  body: announcementBodySchema,
});

/** 공지 작성 서버 액션 입력 */
export const createAnnouncementSchema = z.object({
  eventId: z.string().refine(isUuid, "잘못된 이벤트예요."),
  body: announcementBodySchema,
});

/** 공지 상단 고정/해제 서버 액션 입력 */
export const pinAnnouncementSchema = z.object({
  announcementId: z.string().refine(isUuid, "잘못된 공지예요."),
  pinned: z.boolean({ error: "고정 여부가 올바르지 않아요." }),
});

/** 공지 삭제 서버 액션 입력 */
export const announcementIdSchema = z
  .string()
  .refine(isUuid, "잘못된 공지예요.");

export type AnnouncementFormInput = z.infer<typeof announcementFormSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type PinAnnouncementInput = z.infer<typeof pinAnnouncementSchema>;
