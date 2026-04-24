import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

/**
 * /robots.txt — 검색 봇에 크롤링 허용 범위를 알려 준다.
 * API·개인 쪽은 색인 가치가 낮거나 민감할 수 있어 disallow 로 막는다.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
