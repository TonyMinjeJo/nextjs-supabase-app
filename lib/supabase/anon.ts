import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * 쿠키를 쓰지 않는 익명(anon) 클라이언트. 공개 RPC(get_event_invite)와
 * `"use cache"` 안에서 쓸 수 있습니다. (cache 범위에서는 cookies() 사용 금지)
 * 세션을 저장하지 않으며, 호출마다 새로 만듭니다.
 */
export function createAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
