import type { ReactNode } from "react";
import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

/**
 * `page` 가 클라이언트라 메타를 못 쓰므로 서버 레이아웃에서만 `noindex` 를 건다(회원·자녀 정보).
 */
export const metadata: Metadata = {
  title: "마이페이지 | 육아박사",
  description: "회원 프로필·자녀 설정",
  ...privatePageRobots,
};

export default function MypageLayout({ children }: { children: ReactNode }) {
  return children;
}
