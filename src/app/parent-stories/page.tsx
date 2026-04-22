import type { Metadata } from "next";
import { ContentTopicBoard } from "@/components/ContentTopicBoard";

export const metadata: Metadata = {
  title: "부모 이야기",
  description: "육아를 하며 겪는 감정·관계에 대한 부드러운 안내",
};

export default function ParentStoriesPage() {
  return <ContentTopicBoard topic="parentStories" />;
}
