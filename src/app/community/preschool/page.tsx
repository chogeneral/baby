import type { Metadata } from "next";
import { CommunityRoomBoard } from "@/components/CommunityRoomBoard";

export const metadata: Metadata = {
  title: "유아방",
  description: "3~5살 닉네임 표시 게시판 유아방",
};

export default function PreschoolRoomPage() {
  return <CommunityRoomBoard roomKind="preschool" />;
}
