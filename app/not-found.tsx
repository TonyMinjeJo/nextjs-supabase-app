import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/page-container";
import Link from "next/link";

// 존재하지 않는 경로, 잘못된 이벤트 링크 등에서 보여주는 안내 화면
export default function NotFound() {
  return (
    <PageContainer className="flex flex-col">
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-bold">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-muted-foreground">
          링크가 잘못되었거나 삭제된 이벤트일 수 있어요.
          <br />
          주최자에게 링크를 다시 확인해 보세요.
        </p>
        <Button asChild>
          <Link href="/">홈으로 가기</Link>
        </Button>
      </main>
    </PageContainer>
  );
}
