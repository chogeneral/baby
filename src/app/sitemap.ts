import type { MetadataRoute } from "next";
import { listContentTopicPostEntriesForSitemap } from "@/lib/contentTopicPostStore";
import { contentTopicUrlSegment } from "@/lib/contentTopic";
import { listCommunityPostIdsForSitemap } from "@/lib/postStore";
import { getSiteUrl } from "@/lib/siteUrl";

/**
 * /sitemap.xml — Next.js 가 빌드·요청 시 XML 을 내보낸다(별도 public 파일 불필요).
 * - Google Search Console·네이버 서치어드바이저 제출 URL: `https://(배포도메인)/sitemap.xml`
 * - `NEXT_PUBLIC_SITE_URL` 을 운영 도메인에 맞추면 sitemap·robots 의 절대 URL 이 일치한다.
 * 정적 경로 + Supabase 기반 **공개 글** URL(커뮤니티, 부모이야기, 정보).
 * 글이 많아지면 `generateSitemaps`·청크 분할이 필요할 수 있음(현재 5만 URL 미만 가정).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticPaths = [
    "",
    "contact",
    "region",
    "region/write",
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

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => {
    const href = p === "" ? base : `${base}/${p}`;
    return {
      url: href,
      lastModified: now,
      changeFrequency: p === "" ? ("weekly" as const) : ("monthly" as const),
      priority: p === "" ? 1 : p.startsWith("community") ? 0.8 : 0.6,
    };
  });

  const dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const community = await listCommunityPostIdsForSitemap();
    for (const row of community) {
      const last = row.createdAt ? new Date(row.createdAt) : now;
      dynamicEntries.push({
        url: `${base}/community/${row.id}`,
        lastModified: last,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  } catch {
    /* Supabase 환경변수 누락·빌드 시엔 sitemap 은 정적 항목만 */
  }

  try {
    const topicRows = await listContentTopicPostEntriesForSitemap();
    for (const row of topicRows) {
      const seg = contentTopicUrlSegment(row.topic);
      const last = row.createdAt ? new Date(row.createdAt) : now;
      dynamicEntries.push({
        url: `${base}/${seg}/${row.id}`,
        lastModified: last,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      });
    }
  } catch {
    /* Supabase 누락 시 무시(정적 sitemap만 남음) */
  }

  return [...staticEntries, ...dynamicEntries];
}
