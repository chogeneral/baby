import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

export const metadata: Metadata = {
  title: "정보 · 글 수정 | 육아박사",
  description: "게시글 편집(검색 색인 제외)",
  ...privatePageRobots,
};

export default function InfoEditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
