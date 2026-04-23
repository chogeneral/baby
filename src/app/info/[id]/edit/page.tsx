import { Suspense } from "react";
import { ContentTopicEditForm } from "@/components/ContentTopicEditForm";

type Props = { params: Promise<{ id: string }> };

export default async function InfoEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense>
      <ContentTopicEditForm id={id} topic="info" />
    </Suspense>
  );
}
