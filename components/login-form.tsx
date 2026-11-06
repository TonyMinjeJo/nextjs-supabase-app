"use client";

import { DEFAULT_AFTER_LOGIN } from "@/lib/auth/safe-next";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFormProps = React.ComponentPropsWithoutRef<"div"> & {
  next?: string;
  /** 카드 제목 (기본: "Login") */
  title?: string;
  /** 카드 설명 (기본: 영어 안내 문구) */
  description?: string;
  /** 회원가입 링크 표시 여부 (기본: true) */
  showSignUp?: boolean;
  /** 비밀번호 찾기 링크 표시 여부 (기본: true) */
  showForgot?: boolean;
  /** 폼 하단 보조 링크 (예: 관리자 로그인에서 일반 로그인으로) */
  footerLink?: { href: string; label: string };
};

export function LoginForm({
  className,
  next = DEFAULT_AFTER_LOGIN,
  title = "Login",
  description = "Enter your email below to login to your account",
  showSignUp = true,
  showForgot = true,
  footerLink,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // 로그인 성공 시 검증된 next 경로(기본: 내 이벤트)로 이동합니다.
      router.push(next);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton next={next} />
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            또는
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {showForgot && (
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            {showSignUp && (
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4"
                >
                  Sign up
                </Link>
              </div>
            )}
            {footerLink && (
              <div className="mt-4 text-center text-sm">
                <Link
                  href={footerLink.href}
                  className="underline underline-offset-4"
                >
                  {footerLink.label}
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
