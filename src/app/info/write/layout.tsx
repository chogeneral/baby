import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기 · 정보",
  description: "정보 게시판에 글을 남기는 페이지",
};

export default function InfoWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
