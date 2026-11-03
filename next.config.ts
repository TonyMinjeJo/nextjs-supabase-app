import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // LAN IP로 개발 서버에 접속할 때 /_next 리소스(하이드레이션)가 차단되지 않도록 허용
  allowedDevOrigins: ["192.168.75.81"],
};

export default nextConfig;
