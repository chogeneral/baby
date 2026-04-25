import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/community/young-infant",
        destination: "/community/baby-story",
        permanent: true,
      },
      {
        source: "/community/toddler",
        destination: "/community/baby-story",
        permanent: true,
      },
      {
        source: "/community/preschool",
        destination: "/community/baby-story",
        permanent: true,
      },
    ];
  },
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
