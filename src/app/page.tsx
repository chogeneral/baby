import type { Metadata } from "next";
import { HomeMain } from "@/components/HomeMain";
import { getHomeLatestPostPreviews } from "@/lib/homeLatestPosts";

export const metadata: Metadata = {
  title: "홈",
  description: "육아박사 메인 — 연령별 신생아·발달·부모 이야기",
};

/** 메인: 히어로 + 부모이야기·발달 / 꼬꼬마·정보 최신글(각 5개, 서버에서 스토어를 읽어 한 번에 내려줌). */
export default function Home() {
  const latest = getHomeLatestPostPreviews();
  return <HomeMain latest={latest} />;
}
