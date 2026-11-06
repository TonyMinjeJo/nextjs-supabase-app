import { cn } from "@/lib/utils";

// 페이지 폭 정책을 한 곳에서 제어하는 컨테이너.
// - 기본: 어디서나 500px 모바일 열 (데스크톱에서는 그림자로 열이 구분됩니다)
// - wide: lg(1024px) 이상에서만 max-w-5xl까지 넓어지고, 그보다 작으면 500px 열 그대로
export function PageContainer({
  wide = false,
  className,
  children,
}: {
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto min-h-svh w-full max-w-[500px] bg-background shadow-[0_0_24px_rgba(0,0,0,0.08)]",
        wide && "lg:max-w-5xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

// (app) 그룹 전용: layout이 만든 PageContainer를 해당 페이지에서만 넓히는 표식입니다.
// layout의 컨테이너가 `lg:has-[[data-page-wide]]:max-w-5xl`로 이 표식을 감지합니다.
// 사용법: 페이지 최상단에 <WidePage /> 를 한 번 렌더링하세요. (서버 컴포넌트 그대로 사용 가능)
export function WidePage() {
  return <div data-page-wide hidden />;
}
