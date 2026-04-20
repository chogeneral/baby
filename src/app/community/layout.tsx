import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "임금님 귀는 당나귀 귀",
  description: "닉네임이 보이는 연령별 육아 게시판 — 임금님 귀는 당나귀 귀",
};

/** 클라이언트 페이지가 많아도 제목·설명은 이 레이아웃에서 통일한다 */
export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
