import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

export const metadata: Metadata = {
  title: "글쓰기 · 정보 | 육아박사",
  description: "정보 게시판에 글을 남기는 페이지",
  ...privatePageRobots,
};

export default function InfoWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
