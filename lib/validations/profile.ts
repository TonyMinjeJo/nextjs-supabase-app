import { z } from "zod";

// 프로필 입력 스키마 (Zod 4). 폼(클라이언트)과 서버 액션이 같은 규칙을 씁니다.
// 닉네임은 profiles.username에 저장됩니다. 중복(대소문자 무시)은 스키마로 검사할 수 없고
// DB 고유 제약이 최종 판정하므로, 서버 액션이 unique 위반(23505)을 받아 처리해야 합니다.

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;
export const BIO_MAX = 100;

// DB 제약 profiles_username_check와 동일합니다. 한쪽만 바꾸지 마세요.
// (supabase/migrations/20261109135925_profile_nickname_constraints.sql)
// 한글·영문·숫자·밑줄과 단어 사이 공백 1개만 허용합니다. 앞뒤·연속 공백은 허용하지 않습니다.
export const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣_]+( [0-9A-Za-z가-힣_]+)*$/;

export const nicknameSchema = z
  .string({ error: "닉네임을 입력해 주세요." })
  .trim()
  .min(1, "닉네임을 입력해 주세요.")
  .min(NICKNAME_MIN, `닉네임은 ${NICKNAME_MIN}자 이상 입력해 주세요.`)
  .max(NICKNAME_MAX, `닉네임은 ${NICKNAME_MAX}자 이하로 입력해 주세요.`)
  .regex(
    NICKNAME_PATTERN,
    "한글, 영문, 숫자, 밑줄(_)만 쓸 수 있고 공백은 단어 사이에 하나만 넣을 수 있어요.",
  );

// 소개는 비워 둘 수 있습니다. 폼에서 비우면 ""가 오며, 저장할 때 null로 바꾸는 일은 서버 액션이 합니다.
export const bioSchema = z
  .string()
  .trim()
  .max(BIO_MAX, `소개는 ${BIO_MAX}자 이하로 입력해 주세요.`);

/** 가입 후 닉네임 설정 폼 / 서버 액션 입력 */
export const nicknameFormSchema = z.object({
  nickname: nicknameSchema,
});

/** 프로필 수정 폼 / 서버 액션 입력 */
export const profileFormSchema = z.object({
  nickname: nicknameSchema,
  bio: bioSchema.optional(),
});

export type NicknameFormInput = z.infer<typeof nicknameFormSchema>;
export type ProfileFormInput = z.infer<typeof profileFormSchema>;
