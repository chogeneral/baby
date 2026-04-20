import type { Metadata } from "next";
import { CommunityRoomBoard } from "@/components/CommunityRoomBoard";

export const metadata: Metadata = {
  title: "영아방",
  description: "1살까지(만 1세 이하) 닉네임 표시 게시판 영아방",
};

export default function YoungInfantRoomPage() {
  return <CommunityRoomBoard roomKind="youngInfant" />;
}
