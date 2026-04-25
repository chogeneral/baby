import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

export const metadata: Metadata = {
  title: "글쓰기 | 육아박사",
  description: "연령별 게시판 글 작성 — 임금님 귀는 당나귀 귀",
  ...privatePageRobots,
};

export default function CommunityWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
