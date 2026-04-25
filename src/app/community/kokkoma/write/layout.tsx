import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

/**
 * 글쓰기 폼은 SEO 대상이 아님(목록/상세만 색인).
 */
export const metadata: Metadata = {
  title: "꼬꼬마 · 글쓰기",
  description: "꼬꼬마 게시판에 글을 남깁니다",
  ...privatePageRobots,
};

export default function KokkomaWriteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
