import {
  NICKNAME_MAX,
  NICKNAME_MIN,
  NICKNAME_PATTERN,
} from "@/lib/validations/profile";

// 기본 닉네임 생성 유틸리티. 순수 함수만 있고 I/O(DB 조회)는 하지 않습니다.
// 규칙의 출처는 lib/validations/profile.ts이며, 여기서 만든 값은 항상 그 규칙을 통과합니다.
//
// 중복 확인은 하지 않습니다. profiles는 RLS 때문에 이벤트를 공유하지 않는 사람의 행이 보이지 않아
// 조회로는 "사용 가능"을 알 수 없습니다. 호출하는 쪽이 후보를 순서대로 저장해 보고,
// unique 위반(23505)이면 다음 후보를 쓰세요.

/** 가입 정보에서 쓸 만한 이름을 못 얻었을 때의 기본값 */
export const DEFAULT_NICKNAME = "user";

/** 중복을 피하려고 뒤에 붙이는 숫자의 자릿수 */
const SUFFIX_DIGITS = 4;

/** 허용되지 않는 문자(한글·영문·숫자·밑줄·공백 이외)를 가려내는 패턴 */
const DISALLOWED_CHARS = /[^0-9A-Za-z가-힣_\s]/g;

/**
 * 임의 문자열을 닉네임 규칙에 맞게 정리합니다. (결과가 NICKNAME_MIN보다 짧을 수 있음)
 * NFC 정규화 → 허용 문자 외 제거 → 연속 공백을 하나로 → 앞뒤 공백 제거 → 최대 길이로 자름
 */
export function sanitizeNickname(raw: string): string {
  const cleaned = raw
    .normalize("NFC")
    .replace(DISALLOWED_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, NICKNAME_MAX).trim();
}

/** 닉네임 규칙(길이 + 허용 문자)을 통과하는지. 스키마와 같은 상수·정규식을 씁니다. */
export function isValidNickname(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= NICKNAME_MIN &&
    value.length <= NICKNAME_MAX &&
    NICKNAME_PATTERN.test(value)
  );
}

interface SuggestSource {
  /** OAuth 계정 이름 (예: Google 프로필 이름) */
  fullName?: string | null;
  email?: string | null;
}

/**
 * 가입 정보로 기본 닉네임 하나를 정합니다.
 * 계정 이름 → 이메일 앞부분 순서로, 정리한 결과가 최소 길이 이상인 첫 값을 쓰고 없으면 기본값입니다.
 */
export function suggestNickname({ fullName, email }: SuggestSource): string {
  const sources = [fullName, email?.split("@")[0]];
  for (const source of sources) {
    if (!source) continue;
    const nickname = sanitizeNickname(source);
    if (isValidNickname(nickname)) return nickname;
  }
  return DEFAULT_NICKNAME;
}

interface CandidateOptions {
  /** 후보 개수 (기본 5, 첫 후보는 접미사 없는 기본 닉네임) */
  count?: number;
  /** 0 이상 1 미만 난수. 테스트에서 결과를 고정하려고 주입할 수 있습니다. */
  random?: () => number;
}

/** 4자리 숫자 접미사 (1000~9999) */
function randomSuffix(random: () => number): string {
  const min = 10 ** (SUFFIX_DIGITS - 1);
  const span = 9 * min;
  const offset = Math.min(span - 1, Math.floor(random() * span));
  return String(min + offset);
}

/**
 * 중복될 때 차례로 시도할 닉네임 후보 목록. [기본, 기본+숫자, 기본+숫자, ...]
 * 접미사를 붙여도 최대 길이를 넘지 않게 본문을 자르며, 후보끼리 겹치지 않습니다.
 * 정리한 기본값이 최소 길이에 못 미치면 DEFAULT_NICKNAME으로 대체합니다.
 */
export function generateNicknameCandidates(
  base: string,
  { count = 5, random = Math.random }: CandidateOptions = {},
): string[] {
  if (count <= 0) return [];

  const cleaned = sanitizeNickname(base);
  const root = isValidNickname(cleaned) ? cleaned : DEFAULT_NICKNAME;

  const candidates = new Set<string>([root]);
  // 난수가 계속 같은 값을 내도 무한 반복하지 않도록 시도 횟수에 상한을 둡니다.
  for (
    let attempt = 0;
    candidates.size < count && attempt < count * 10;
    attempt++
  ) {
    const suffix = randomSuffix(random);
    const head = root.slice(0, NICKNAME_MAX - suffix.length).trim();
    candidates.add(`${head}${suffix}`);
  }
  return [...candidates];
}
