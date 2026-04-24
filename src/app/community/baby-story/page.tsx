import type { Metadata } from "next";
import { BabyStoryBoard } from "@/components/BabyStoryBoard";

export const metadata: Metadata = {
  title: "아기이야기",
  description: "우리 아이들의 이야기를 함께 나눠요 — 육아박사 아기이야기 게시판",
};

export default function BabyStoryPage() {
  return <BabyStoryBoard />;
}
