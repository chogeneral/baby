import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기 · 부모 이야기",
  description: "부모 이야기 주제로 글을 남기는 페이지",
};

export default function ParentStoriesWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
