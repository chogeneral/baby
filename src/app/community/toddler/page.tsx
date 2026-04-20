import type { Metadata } from "next";
import { CommunityRoomBoard } from "@/components/CommunityRoomBoard";

export const metadata: Metadata = {
  title: "토들러방",
  description: "2살까지(만 2세) 닉네임 표시 게시판 토들러방",
};

export default function ToddlerRoomPage() {
  return <CommunityRoomBoard roomKind="toddler" />;
}
