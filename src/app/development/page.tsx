import type { Metadata } from "next";
import { ContentTopicBoard } from "@/components/ContentTopicBoard";

export const metadata: Metadata = {
  title: "발달",
  description: "대·소근육, 언어, 사회성 등 발달에 대한 개요",
};

export default function DevelopmentPage() {
  return <ContentTopicBoard topic="development" />;
}
