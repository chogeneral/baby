import type { NextConfig } from "next";

/**
 * dompurify·jsdom 을 `serverExternalPackages` 로 제외하면 로컬에선 문제없어도
 * Vercel 서버리스에서 패키지 경로 불일치로 **`import`/초기 로드 단계**에서 예외가 나며
 * (이건 `sanitizePostHtml` 안 try/catch 로 잡히지 않음) `/community/[id]` 등 RSC 가 500이 될 수 있다.
 * 따라서 기본처럼 서버 번들에 포함한다.
 */
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
