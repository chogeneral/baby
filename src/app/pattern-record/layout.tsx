import type { ReactNode } from "react";
import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

/**
 * 패턴 기록(시간·루틴) — 가정용 개인 맥락이므로 색인 제외.
 */
export const metadata: Metadata = {
  title: "패턴 기록 | 육아박사",
  description: "수면·수유 등 아이 루틴을 남기는 화면(검색 색인 제외)",
  ...privatePageRobots,
};

export default function PatternRecordLayout({ children }: { children: ReactNode }) {
  return children;
}
