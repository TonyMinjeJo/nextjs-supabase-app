import { PageContainer } from "@/components/page-container";
import Link from "next/link";

// 이벤트 초대(/e/*) 공개 레이아웃: 비로그인 사용자도 접근하므로 로그인 메뉴 없이 로고만 둡니다.
export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer className="flex flex-col">
      <header className="w-full border-b border-b-foreground/10">
        <div className="mx-auto flex h-14 w-full items-center px-4">
          <Link href="/" className="font-semibold">
            모임 이벤트
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full flex-1 px-4 py-6">{children}</main>
    </PageContainer>
  );
}
