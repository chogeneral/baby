import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

/**
 * `/record` 입력 화면 — 로그인 후 가정 기록이므로 색인 제외.
 */
export const metadata: Metadata = {
  title: "아기 기록 | 육아박사",
  description: "성장(몸무게·키·머리둘레)과 오늘의 일상(검색 색인 제외)",
  ...privatePageRobots,
};

export default function RecordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
