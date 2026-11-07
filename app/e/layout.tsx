import { PageContainer } from "@/components/page-container";
import { SignedInLogout } from "@/components/signed-in-logout";
import Link from "next/link";
import { Suspense } from "react";

// 이벤트 초대(/e/*) 공개 레이아웃: 비로그인 사용자도 접근하므로 로고만 두고,
// 로그인 상태일 때만 오른쪽에 로그아웃을 보여줍니다.
export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer className="flex flex-col">
      <header className="w-full border-b border-b-foreground/10">
        <div className="mx-auto flex h-14 w-full items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            모임 이벤트
          </Link>
          <Suspense fallback={null}>
            <SignedInLogout />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full flex-1 px-4 py-6">{children}</main>
    </PageContainer>
  );
}
