import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { PageContainer } from "@/components/page-container";
import { SignedInLogout } from "@/components/signed-in-logout";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { DEFAULT_AFTER_LOGIN, EVENTS_HOME } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

// 로그인 상태에 따라 시작 버튼 동선을 나눕니다. (비로그인: Google 로그인, 로그인: 내 이벤트)
async function StartButton() {
  if (!hasEnvVars) {
    return (
      <Button asChild className="w-full">
        <Link href="/auth/login">시작하기</Link>
      </Button>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    return (
      <Button asChild className="w-full">
        <Link href={EVENTS_HOME}>내 이벤트로 이동</Link>
      </Button>
    );
  }

  return (
    <GoogleSignInButton next={DEFAULT_AFTER_LOGIN} label="Google로 시작하기" />
  );
}

export default function Home() {
  return (
    <PageContainer className="flex flex-col">
      <header className="mx-auto flex h-14 w-full items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          모임 이벤트
        </Link>
        <div className="flex items-center">
          <Suspense fallback={null}>
            <SignedInLogout />
          </Suspense>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mx-auto flex w-full flex-1 flex-col justify-center gap-8 px-4 pb-16">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            공지, 참석, 카풀, 정산을
            <br />
            링크 하나로
          </h1>
          <p className="text-sm text-muted-foreground">
            카톡방 수작업 없이 모임 이벤트를 만들고, 링크로 초대하고, 끝까지
            정산하세요.
          </p>
        </div>
        <Suspense
          fallback={
            <Button className="w-full" disabled>
              불러오는 중...
            </Button>
          }
        >
          <StartButton />
        </Suspense>
      </main>
    </PageContainer>
  );
}
