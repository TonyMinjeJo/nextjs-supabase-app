// Supabase Auth의 영어 에러 메시지를 한국어로 바꿉니다. 매핑이 없으면 기본 문구를 반환합니다.
const MESSAGES: [pattern: RegExp, message: string][] = [
  [/invalid login credentials/i, "이메일 또는 비밀번호가 올바르지 않습니다."],
  [/email not confirmed/i, "이메일 인증이 완료되지 않았습니다."],
  [/user already registered/i, "이미 가입된 이메일입니다."],
  [/password should be at least/i, "비밀번호는 6자 이상이어야 합니다."],
  [/unable to validate email/i, "올바른 이메일 형식이 아닙니다."],
  [
    /rate limit|too many requests/i,
    "요청이 많습니다. 잠시 후 다시 시도해주세요.",
  ],
  [
    /new password should be different/i,
    "새 비밀번호는 기존 비밀번호와 달라야 합니다.",
  ],
];

export const DEFAULT_ERROR_MESSAGE = "오류가 발생했습니다.";

export function toKoreanAuthError(error: unknown): string {
  if (!(error instanceof Error)) return DEFAULT_ERROR_MESSAGE;
  const hit = MESSAGES.find(([pattern]) => pattern.test(error.message));
  return hit ? hit[1] : DEFAULT_ERROR_MESSAGE;
}
