import { Suspense } from "react";
import { ContentTopicEditForm } from "@/components/ContentTopicEditForm";

type Props = { params: Promise<{ id: string }> };

export default async function ParentStoriesEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense>
      <ContentTopicEditForm id={id} topic="부모이야기" />
    </Suspense>
  );
}
