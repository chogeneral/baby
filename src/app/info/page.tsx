import type { Metadata } from "next";
import { ContentTopicBoard } from "@/components/ContentTopicBoard";

export const metadata: Metadata = {
  title: "정보",
  description: "육아·가족 생활에 도움이 되는 안내와 자료를 모아 보는 게시판",
};

/**
 * 정보 메뉴 — 글 목록·글쓰기만 두고, 지도·실시간 주변 검색은 /region 에서 제공한다.
 */
export default function InfoTopicPage() {
  return <ContentTopicBoard topic="정보" />;
}
