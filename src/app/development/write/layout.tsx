import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기 · 발달",
  description: "발달 주제로 글을 남기는 페이지",
};

export default function DevelopmentWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
