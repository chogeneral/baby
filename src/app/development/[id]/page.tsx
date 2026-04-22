import { ContentTopicDetail } from "@/components/ContentTopicDetail";

type Props = { params: Promise<{ id: string }> };

export default async function DevelopmentDetailPage({ params }: Props) {
  const { id } = await params;
  return <ContentTopicDetail id={id} topic="development" />;
}
