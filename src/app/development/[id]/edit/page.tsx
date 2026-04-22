import { Suspense } from "react";
import { ContentTopicEditForm } from "@/components/ContentTopicEditForm";

type Props = { params: Promise<{ id: string }> };

export default async function DevelopmentEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense>
      <ContentTopicEditForm id={id} topic="development" />
    </Suspense>
  );
}
