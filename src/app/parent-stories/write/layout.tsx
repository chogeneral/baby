import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

export const metadata: Metadata = {
  title: "글쓰기 · 부모 이야기 | 육아박사",
  description: "부모 이야기 주제로 글을 남기는 페이지",
  ...privatePageRobots,
};

export default function ParentStoriesWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
