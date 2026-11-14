import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "@/lib/utils";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 개발 환경에서만 환경 변수가 없을 때 인증 검사를 건너뜁니다.
  // 프로덕션에서는 건너뛰지 않고 getSupabaseEnv()가 오류를 던집니다. (fail-closed)
  if (!hasEnvVars && process.env.NODE_ENV !== "production") {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname, search } = request.nextUrl;
  // 비로그인 허용 경로: 홈, 로그인/인증, 이벤트 초대(/e/*, 공개 요약 + 로그인 유도),
  // 관리자 로그인(/admin/login 정확히 일치만. /admin 접두사 전체를 열지 않습니다.),
  // 공유 미리보기 이미지(/opengraph-image, /twitter-image 정확히 일치만. 크롤러가 비로그인으로 받아 갑니다.)
  const isPublicPath =
    pathname === "/" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/e/") ||
    pathname === "/admin/login";
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!user && !isPublicPath) {
    // 로그인 후 원래 경로로 돌아오도록 next를 붙여 로그인 페이지로 보냅니다.
    // /admin* 은 관리자 로그인으로, 그 외는 일반 로그인으로 보냅니다.
    const url = request.nextUrl.clone();
    url.pathname = isAdminPath ? "/admin/login" : "/auth/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // 이미 로그인한 사용자가 관리자 로그인에 접근하면 /admin 으로 보냅니다.
  // 새 redirect 응답에도 세션 쿠키를 복사해 세션이 끊기지 않게 합니다.
  if (user && pathname === "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
