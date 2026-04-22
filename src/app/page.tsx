import type { Metadata } from "next";
import { HomeMain } from "@/components/HomeMain";

export const metadata: Metadata = {
  title: "홈",
  description: "육아도사 메인 — 연령별 신생아·발달·부모 이야기",
};

/** 메인: 히어로 랜딩 */
export default function Home() {
  return <HomeMain />;
}
