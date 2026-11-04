import { LoginForm } from "@/components/login-form";
import { getSafeNext } from "@/lib/auth/safe-next";
import { Suspense } from "react";

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  // next는 반드시 getSafeNext로 검증한 뒤 전달합니다. (open-redirect 방어)
  return <LoginForm next={getSafeNext(next)} />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
