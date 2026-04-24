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
 * [수정된 부분]
 * 1. export default 'async' function Home() : 비동기 함수로 변경
 * 2. await getHomeLatestPostPreviews() : 데이터가 올 때까지 대기
 */
export default async function Home() {
  // 데이터를 슈파베이스에서 가져올 때까지 기다립니다.
  const latest = await getHomeLatestPostPreviews();

  // 데이터가 들어온 후에 HomeMain을 렌더링합니다.
  return <HomeMain latest={latest} />;
}
