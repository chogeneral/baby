import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기 · 육아용품",
  description: "육아용품 주제로 글을 남기는 페이지",
};

export default function ParentingSuppliesWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
