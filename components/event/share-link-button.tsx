"use client";

import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

interface ShareLinkButtonProps {
  /** 이벤트 공유 코드 (/e/{code}) */
  shareCode: string;
}

// 초대 링크를 클립보드에 복사합니다. 실패하면 링크를 직접 복사할 수 있도록 안내합니다.
export function ShareLinkButton({ shareCode }: ShareLinkButtonProps) {
  async function handleCopy() {
    const url = `${window.location.origin}/e/${encodeURIComponent(shareCode)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("초대 링크를 복사했어요.", { description: url });
    } catch {
      toast.error("자동 복사에 실패했어요. 아래 링크를 직접 복사해 주세요.", {
        description: url,
      });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-11 flex-1"
      onClick={handleCopy}
    >
      <Link2 className="size-4" />
      링크 복사
    </Button>
  );
}
