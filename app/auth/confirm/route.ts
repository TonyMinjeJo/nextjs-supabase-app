import { getSafeNext } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// verifyOtp에 전달할 수 있는 type만 허용합니다. (임의 문자열 차단)
const OTP_TYPES: ReadonlySet<string> = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function parseOtpType(value: string | null): EmailOtpType | null {
  return value && OTP_TYPES.has(value) ? (value as EmailOtpType) : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = parseOtpType(searchParams.get("type"));
  const next = getSafeNext(searchParams.get("next"), "/");

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next);
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(
    `/auth/error?error=${encodeURIComponent("토큰 또는 인증 유형이 없습니다.")}`,
  );
}
