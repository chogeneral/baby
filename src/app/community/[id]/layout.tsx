import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SeoArticleJsonLd } from "@/components/SeoArticleJsonLd";
import { getCachedSeoCommunityPost } from "@/lib/seo/cachedSeoData";
import { toPlainTextExcerpt } from "@/lib/seoText";
import { getSiteUrl } from "@/lib/siteUrl";

type Props = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

/**
 * 클라이언트 상세(`page.tsx`)는 메타를 내보낼 수 없어, 같은 세그먼트 레이아웃(서버)에서
 * 제목·설명·canonical·JSON-LD 를 맞춘다. `getCached...`로 본문 조회 1회로 묶인다.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getCachedSeoCommunityPost(id);
  const site = getSiteUrl();
  if (!post) {
    return {
      title: "커뮤니티",
      description: "육아박사 커뮤니티",
      robots: { index: false, follow: true },
    };
  }
  const url = `${site}/community/${id}`;
  const desc =
    toPlainTextExcerpt(post.content) || "육아박사 아기이야기·꼬꼬마 커뮤니티";
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

export default async function CommunityPostLayout({ children, params }: Props) {
  const { id } = await params;
  const post = await getCachedSeoCommunityPost(id);
  if (!post) {
    return children;
  }
  const site = getSiteUrl();
  const url = `${site}/community/${id}`;
  const desc =
    toPlainTextExcerpt(post.content) || "육아박사 아기이야기·꼬꼬마 커뮤니티";
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
