import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* 히어로·카드에 사용하는 Unsplash 이미지 도메인 허용 */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
