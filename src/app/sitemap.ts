import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

/**
 * /sitemap.xml — 공개·탐색 가치가 있는 정적 경로만 나열한다.
 * `community/[id]` 처럼 DB 기반 동적 글 URL은 이후 `generateSitemaps` 또는
 * Supabase에서 id/slug 목록을 읽어 확장할 수 있다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  const staticPaths = [
    "",
    "contact",
    "region",
    "parent-stories",
    "info",
    "community/baby-story",
    "community/kokkoma",
    "community/kokkoma/write",
    "community/write",
    "newborn-care",
    "login",
    "signup",
  ];

  const now = new Date();

  return staticPaths.map((p, i) => {
    const href = p === "" ? base : `${base}/${p}`;
    return {
      url: href,
      lastModified: now,
      changeFrequency: p === "" ? ("weekly" as const) : ("monthly" as const),
      priority: p === "" ? 1 : p.startsWith("community") ? 0.8 : 0.6,
    };
  });
}
