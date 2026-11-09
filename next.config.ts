import type { NextConfig } from "next";

// Supabase Storage 서명 URL의 호스트. 환경 변수가 없거나 형식이 잘못돼도 설정이 깨지지 않게 합니다.
function getSupabaseImageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = getSupabaseImageHost();

const nextConfig: NextConfig = {
  cacheComponents: true,
  // LAN IP로 개발 서버에 접속할 때 /_next 리소스(하이드레이션)가 차단되지 않도록 허용
  allowedDevOrigins: ["192.168.75.81"],
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/sign/event-covers/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
