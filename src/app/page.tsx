import type { Metadata } from "next";
import { HomeMain } from "@/components/HomeMain";

export const metadata: Metadata = {
  title: "홈",
  description: "육아도사 메인 — 연령별 신생아·발달·육아용품·부모 이야기",
};

/** 메인: 세션(로그인) 여부와 첫째 출생 연도로 맞춤 배너·카드 강조를 보여 준다 */
export default function Home() {
  return <HomeMain />;
}
