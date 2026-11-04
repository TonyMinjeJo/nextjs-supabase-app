import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: { default: "모임 이벤트", template: "%s | 모임 이벤트" },
  description: "공지, 참석, 카풀, 정산을 링크 하나로 관리하는 모임 이벤트 앱",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* 모바일 우선: 데스크톱에서도 500px 폭의 모바일 열로 가운데 정렬 */}
          <div className="mx-auto min-h-svh w-full max-w-[500px] bg-background shadow-[0_0_24px_rgba(0,0,0,0.08)]">
            {children}
          </div>
          {/* 이 프로젝트의 색상 변수는 HSL 값이라 hsl()로 감싸야 토스트 배경이 보입니다. */}
          <Toaster
            style={
              {
                "--normal-bg": "hsl(var(--popover))",
                "--normal-text": "hsl(var(--popover-foreground))",
                "--normal-border": "hsl(var(--border))",
              } as React.CSSProperties
            }
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
