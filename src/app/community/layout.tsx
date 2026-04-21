import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티",
  description:
    "연령별 게시판과 익명 꼬꼬마 — 닉네임이 보이는 육아 커뮤니티(육아도사)",
};

/** 클라이언트 페이지가 많아도 제목·설명은 이 레이아웃에서 통일한다 */
export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
