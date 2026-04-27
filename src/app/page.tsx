import type { Metadata } from "next";
import { HomeMain } from "@/components/HomeMain";
import { getHomeLatestPostPreviews } from "@/lib/homeLatestPosts";

/**
 * 홈만: 제목 중복(`육아박사 | 육아박사`) 방지 + 대표 URL(canonical·og:url) 고정.
 * — `description` 은 루트 `layout` 의 `defaultSiteDescription` 과 동일하게 두고 중복 정의하지 않는다.
 */
export const metadata: Metadata = {
  title: { absolute: "육아박사" },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    /* metadataBase 기준 절대 URL로 풀림 — 소셜 스크래퍼가 공유 링크를 한 URL로 묶기 쉽다 */
    url: "/",
    title: "육아박사",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "육아박사" }],
  },
};

/**
 * 루트 홈: `getHomeLatestPostPreviews()`로 Supabase `posts`·`content_topic_posts` 최신 5개씩 읽어
 * 히어로 아래 2×2 최신 글에 넘긴다. env 미설정 시 빈 배열로 렌더(프리렌더 실패 방지).
 */
export default async function Home() {
  const latest = await getHomeLatestPostPreviews();
  return <HomeMain latest={latest} />;
}
