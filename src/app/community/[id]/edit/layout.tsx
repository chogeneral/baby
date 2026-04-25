import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

/**
 * 커뮤니티 글 **수정** — 비밀번호·권한과 연결돼 색인 가치가 없다.
 */
export const metadata: Metadata = {
  title: "커뮤니티 · 글 수정 | 육아박사",
  description: "게시글 편집(검색 색인 제외)",
  ...privatePageRobots,
};

export default function CommunityEditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
