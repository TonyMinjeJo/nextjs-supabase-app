import { cn } from "@/lib/utils";
import Image from "next/image";

// 이벤트 커버 이미지 표시. 16:9 비율 박스에 채웁니다.
// 서명 URL은 만료·갱신마다 주소가 바뀌어 이미지 최적화 캐시 효율이 낮으므로
// 최적화 파이프라인을 거치지 않고(unoptimized) 원본을 그대로 보여 줍니다.
export function CoverImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-muted",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(min-width: 640px) 500px, 100vw"
        className="object-cover"
      />
    </div>
  );
}
