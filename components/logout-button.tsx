"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const LOGOUT_ERROR_MESSAGE =
  "로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // signOut 요청 중 상태. 오류 시에는 반드시 false로 되돌립니다.
  const [signingOut, setSigningOut] = useState(false);

  const logout = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(LOGOUT_ERROR_MESSAGE);
        setSigningOut(false);
        return;
      }
      // 성공: replace로 보호 화면이 히스토리에 남지 않게 하고, 이동이 끝날 때까지 isPending 유지
      startTransition(() => {
        router.replace("/");
        router.refresh();
      });
      setSigningOut(false);
    } catch {
      toast.error(LOGOUT_ERROR_MESSAGE);
      setSigningOut(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-10 px-2 sm:h-8", className)}
      onClick={logout}
      disabled={signingOut || isPending}
    >
      로그아웃
    </Button>
  );
}
