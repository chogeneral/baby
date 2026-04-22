import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "아기 기록",
  description: "성장(몸무게·키·머리둘레)과 오늘의 일상을 남깁니다.",
};

export default function RecordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
