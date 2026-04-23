import type { Metadata } from "next";
import { KokkomaBoard } from "@/components/KokkomaBoard";

export const metadata: Metadata = {
  title: "꼬꼬마",
  description: "전 연령 익명 육아 게시판 꼬꼬마 — 임금님 귀는 당나귀 귀",
};

export default function KokkomaRoomPage() {
  return <KokkomaBoard />;
}
