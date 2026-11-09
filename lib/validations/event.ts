import { z } from "zod";

// 폼 입력값 검증 스키마 (Zod 4).
// 일시는 <input type="datetime-local"> 형식("YYYY-MM-DDTHH:mm", 시간대 없음)을 받습니다.
// 서버 저장 시에는 lib/datetime.ts의 toKstIso()로 ISO(+09:00)로 변환합니다.

const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// events.cover_image_path CHECK와 동일: {소문자 uuid}/{소문자 uuid}.{jpg|jpeg|png|webp}
const UUID_LOWER =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const COVER_IMAGE_PATH_PATTERN = new RegExp(
  `^${UUID_LOWER}/${UUID_LOWER}\\.(jpg|jpeg|png|webp)$`,
);

/** 실제로 존재하는 날짜인지 (예: 2026-02-30 거부) */
function isRealDate(value: string): boolean {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value.slice(0, 10)
  );
}

const dateTimeString = (requiredMessage: string) =>
  z
    .string()
    .min(1, requiredMessage)
    .regex(DATE_TIME_PATTERN, "올바른 일시가 아닙니다.")
    .refine(isRealDate, "존재하지 않는 날짜입니다.");

/** 주간 반복 설정 */
export const recurrenceSchema = z.object({
  /** 반복 요일 (0=일 ~ 6=토) */
  weekday: z.number().int().min(0).max(6),
  /** 반복 종료일 (YYYY-MM-DD) */
  endDate: z
    .string()
    .min(1, "종료일을 입력해 주세요.")
    .regex(DATE_PATTERN, "올바른 날짜가 아닙니다.")
    .refine(isRealDate, "존재하지 않는 날짜입니다."),
});

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "제목을 입력해 주세요.")
      .max(100, "제목은 100자 이하로 입력해 주세요."),
    description: z
      .string()
      .trim()
      .max(2000, "설명은 2000자 이하로 입력해 주세요.")
      .optional(),
    startsAt: dateTimeString("일시를 입력해 주세요."),
    location: z
      .string()
      .trim()
      .min(1, "장소를 입력해 주세요.")
      .max(200, "장소는 200자 이하로 입력해 주세요."),
    capacity: z
      .number("정원은 숫자로 입력해 주세요.")
      .int("정원은 정수여야 합니다.")
      .min(1, "정원은 1명 이상이어야 합니다."),
    // 폼에서 비워 두면 ""가 오므로 빈 문자열은 "마감 없음"으로 허용합니다.
    rsvpDeadline: z
      .union([z.literal(""), dateTimeString("마감 일시를 입력해 주세요.")])
      .optional(),
    recurrence: recurrenceSchema.optional(),
    // 커버 이미지 Storage 경로. 비우면(""/null) 커버 없음. DB CHECK와 같은 형식만 허용합니다.
    coverImagePath: z
      .union([
        z.literal(""),
        z
          .string()
          .regex(COVER_IMAGE_PATH_PATTERN, "올바른 이미지 경로가 아닙니다."),
      ])
      .nullish(),
  })
  .superRefine((value, ctx) => {
    // 형식 검증이 통과한 경우에만 값 비교를 합니다.
    if (!DATE_TIME_PATTERN.test(value.startsAt)) return;

    if (
      value.rsvpDeadline &&
      DATE_TIME_PATTERN.test(value.rsvpDeadline) &&
      value.rsvpDeadline >= value.startsAt
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rsvpDeadline"],
        message: "신청 마감은 이벤트 일시 이전이어야 합니다.",
      });
    }

    if (value.recurrence && DATE_PATTERN.test(value.recurrence.endDate)) {
      // 같은 고정 길이 형식(YYYY-MM-DD)이라 문자열 비교가 날짜 비교와 같습니다.
      if (value.recurrence.endDate < value.startsAt.slice(0, 10)) {
        ctx.addIssue({
          code: "custom",
          path: ["recurrence", "endDate"],
          message: "반복 종료일은 시작일 이후여야 합니다.",
        });
      }
    }
  });

export type EventFormInput = z.infer<typeof eventFormSchema>;
