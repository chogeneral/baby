import type { Metadata } from "next";
import {
  contentTopicPageInfo,
  contentTopicUrlSegment,
  type ContentTopicKind,
} from "@/lib/contentTopic";
import { toPlainTextExcerpt } from "@/lib/seoText";
import { getSiteUrl } from "@/lib/siteUrl";
import { getCachedSeoContentTopicPost } from "./cachedSeoData";

/**
 * `/parent-stories/[id]`, `/info/[id]` 공통: 토픽이 경로와 맞는 글만 index 메타, 아니면 noindex
 */
export async function makeContentTopicDetailMetadata(
  id: string,
  expectedTopic: ContentTopicKind,
): Promise<Metadata> {
  const post = await getCachedSeoContentTopicPost(id);
  const site = getSiteUrl();
  const pageInfo = contentTopicPageInfo[expectedTopic];
  if (!post || post.topic !== expectedTopic) {
    return {
      title: pageInfo.title,
      robots: { index: false, follow: true },
    };
  }
  const path = `/${contentTopicUrlSegment(expectedTopic)}/${id}`;
  const url = `${site}${path}`;
  const desc = toPlainTextExcerpt(post.content) || pageInfo.subtext;
  return {
    title: post.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: desc,
      url,
      type: "article",
    },
    twitter: {
      title: post.title,
      description: desc,
    },
  };
}
