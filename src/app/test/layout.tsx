import type { ReactNode } from "react";
import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

/**
 * guestbook·Supabase 점검용 테스트 라우트 — 색인 제외(운영 URL 로 노출되지 않게).
 */
export const metadata: Metadata = {
  title: "내부 테스트",
  description: "개발·확인용 페이지(검색 색인 제외)",
  ...privatePageRobots,
};

export default function TestLayout({ children }: { children: ReactNode }) {
  return children;
}
