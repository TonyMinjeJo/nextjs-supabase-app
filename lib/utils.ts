import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 개발 환경에서 환경 변수 없이도 화면을 띄우기 위한 확인용 값입니다.
// 프로덕션에서는 이 값으로 인증을 건너뛰지 않습니다. (lib/supabase/env.ts 참고)
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
