import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기",
  description: "연령별 게시판 글 작성 — 임금님 귀는 당나귀 귀",
};

export default function CommunityWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
