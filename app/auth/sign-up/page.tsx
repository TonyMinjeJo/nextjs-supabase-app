import { PageContainer } from "@/components/page-container";
import { SignUpForm } from "@/components/sign-up-form";
import { getSafeNext } from "@/lib/auth/safe-next";
import { Suspense } from "react";

async function SignUpContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  // next는 반드시 getSafeNext로 검증한 뒤 전달합니다. (open-redirect 방어)
  return <SignUpForm next={getSafeNext(next)} />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <PageContainer className="flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <SignUpContent searchParams={searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
