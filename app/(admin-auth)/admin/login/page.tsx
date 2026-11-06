import { LoginForm } from "@/components/login-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getSafeNext } from "@/lib/auth/safe-next";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "관리자 로그인",
};

// next는 /admin 또는 /admin/ 으로 시작하는 내부 경로만 허용합니다.
function getAdminNext(next: unknown): string {
  const safe = getSafeNext(next, "/admin");
  return safe === "/admin" || safe.startsWith("/admin/") ? safe : "/admin";
}

async function AdminLoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <LoginForm
      next={getAdminNext(next)}
      title="관리자 로그인"
      description="서비스 운영자 계정으로 로그인해 주세요."
      showSignUp={false}
      footerLink={{ href: "/auth/login", label: "일반 로그인으로" }}
    />
  );
}

// 사이드바/탭이 없는 관리자 로그인 화면. (admin) 레이아웃 밖에 둡니다.
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between px-4">
        <span className="font-semibold">모임 이벤트 관리자</span>
        <ThemeSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Suspense>
            <AdminLoginContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
