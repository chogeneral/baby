import type { Metadata } from "next";
import { SeoArticleJsonLd } from "@/components/SeoArticleJsonLd";
import { contentTopicUrlSegment } from "@/lib/contentTopic";
import { getCachedSeoContentTopicPost } from "@/lib/seo/cachedSeoData";
import { makeContentTopicDetailMetadata } from "@/lib/seo/contentTopicMetadata";
import { toPlainTextExcerpt } from "@/lib/seoText";
import { getSiteUrl } from "@/lib/siteUrl";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return makeContentTopicDetailMetadata(id, "정보");
}

export default async function InfoDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const post = await getCachedSeoContentTopicPost(id);
  if (!post || post.topic !== "정보") {
    return children;
  }
  const site = getSiteUrl();
  const path = `/${contentTopicUrlSegment("정보")}/${id}`;
  const url = `${site}${path}`;
  const desc = toPlainTextExcerpt(post.content) || "육아·가족 정보";
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
