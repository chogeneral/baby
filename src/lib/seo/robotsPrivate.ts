import type { Metadata } from "next";

/**
 * 로그인·마이페이지·가정기록·글쓰기/수정·내부 테스트 등: 검색 색인에 오르지 않게 한다.
 * `follow: true` 는 유지 — 크롤러가 noindex 페이지에서 내링크(공개 콘텐츠)로 나갈 수 있게.
 */
export const privatePageRobots: Pick<Metadata, "robots"> = {
  robots: { index: false, follow: true },
};
