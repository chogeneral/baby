import type { ReactNode } from "react";
import type { Metadata } from "next";
import { privatePageRobots } from "@/lib/seo/robotsPrivate";

/**
 * 가정용 아이기록 목록·상세: 개인 맥락이 강하므로 전 구간 `noindex`.
 */
export const metadata: Metadata = {
  title: "우리 아이 기록 | 육아박사",
  description: "성장·일일 기록(비공개 색인)",
  ...privatePageRobots,
};

export default function BabyRecordsLayout({ children }: { children: ReactNode }) {
  return children;
}
