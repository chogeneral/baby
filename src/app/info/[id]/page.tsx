import { ContentTopicDetail } from "@/components/ContentTopicDetail";

type Props = { params: Promise<{ id: string }> };

export default async function InfoDetailPage({ params }: Props) {
  const { id } = await params;
  return <ContentTopicDetail id={id} topic="info" />;
}
