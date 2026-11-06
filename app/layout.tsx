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
          {/* 폭 정책은 각 영역에서 components/page-container.tsx로 적용합니다. */}
          {children}
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
