import type { Metadata } from "next";
import { HomeMain } from "@/components/HomeMain";
import { getHomeLatestPostPreviews } from "@/lib/homeLatestPosts";

export const metadata: Metadata = {
  title: { absolute: "육아박사" },
  description:
    "완벽한 부모보다 행복한 부모를 꿈꾸는 육아박사. 신생아 발달 정보, 부모 교육, 우리 동네 육아 소식까지 한 번에 확인하세요.",
  openGraph: {
    title: "육아박사",
    description: "행복한 부모를 위한 내일의 응원",
    images: ["/og-image.png"],
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
