import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * 서버에서는 dompurify·jsdom 을 번들 안에서 풀패키지로 끌고 오지 않도록 외부 패키지로 둔다.
   */
  serverExternalPackages: ["dompurify", "jsdom"],

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
