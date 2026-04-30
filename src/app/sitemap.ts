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
  const now = new Date();

  // 검색 색인 가치가 있는 공개 콘텐츠 페이지만 포함한다.
  // login, signup, write 폼 등 유틸리티·인증 페이지는 색인 품질을 낮추므로 제외한다.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: base,                                priority: 1.0, changeFrequency: "daily"   as const },
    { url: `${base}/newborn-care`,              priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${base}/parent-stories`,            priority: 0.8, changeFrequency: "weekly"  as const },
    { url: `${base}/info`,                      priority: 0.8, changeFrequency: "weekly"  as const },
    { url: `${base}/community/baby-story`,      priority: 0.8, changeFrequency: "daily"   as const },
    { url: `${base}/community/kokkoma`,         priority: 0.7, changeFrequency: "daily"   as const },
    { url: `${base}/region`,                    priority: 0.7, changeFrequency: "daily"   as const },
    { url: `${base}/contact`,                   priority: 0.4, changeFrequency: "yearly"  as const },
  ].map((entry) => ({ ...entry, lastModified: now }));

  const dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const community = await listCommunityPostIdsForSitemap();
    for (const row of community) {
      dynamicEntries.push({
        url: `${base}/community/${row.id}`,
        lastModified: row.createdAt ? new Date(row.createdAt) : now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    /* Supabase 환경변수 누락·빌드 시엔 정적 항목만 반환 */
  }

  try {
    const topicRows = await listContentTopicPostEntriesForSitemap();
    for (const row of topicRows) {
      const seg = contentTopicUrlSegment(row.topic);
      dynamicEntries.push({
        url: `${base}/${seg}/${row.id}`,
        lastModified: row.createdAt ? new Date(row.createdAt) : now,
        changeFrequency: "monthly",
        priority: row.topic === "부모이야기" ? 0.7 : 0.6,
      });
    }
  } catch {
    /* Supabase 누락 시 무시 */
  }

  return [...staticEntries, ...dynamicEntries];
}
