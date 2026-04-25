import type { Metadata } from "next";
import { SeoArticleJsonLd } from "@/components/SeoArticleJsonLd";
import { getCachedSeoContentTopicPost } from "@/lib/seo/cachedSeoData";
import { makeContentTopicDetailMetadata } from "@/lib/seo/contentTopicMetadata";
import { toPlainTextExcerpt } from "@/lib/seoText";
import { getSiteUrl } from "@/lib/siteUrl";
import { contentTopicUrlSegment } from "@/lib/contentTopic";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return makeContentTopicDetailMetadata(id, "부모이야기");
}

/**
 * `부모이야기` 토픽이 아닌 id 로 접근해도 JSON-LD 는 유효한 글일 때만 삽입한다.
 */
export default async function ParentStoriesDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const post = await getCachedSeoContentTopicPost(id);
  if (!post || post.topic !== "부모이야기") {
    return children;
  }
  const site = getSiteUrl();
  const path = `/${contentTopicUrlSegment("부모이야기")}/${id}`;
  const url = `${site}${path}`;
  const desc = toPlainTextExcerpt(post.content) || "부모 이야기";
  return (
    <>
      <SeoArticleJsonLd
        url={url}
        headline={post.title}
        datePublished={post.createdAt}
        description={desc}
        authorName={post.authorNickname}
      />
      {children}
    </>
  );
}
