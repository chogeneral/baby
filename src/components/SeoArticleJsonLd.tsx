type Props = {
  url: string;
  headline: string;
  datePublished: string;
  description: string;
  authorName?: string;
};

/**
 * Google 등에 글·상세 URL 을 `Article` 구조화 데이터로 전달(검색 결과 리치 항목 후보).
 * JSON-LD 는 서버에서만 넣는다(클라이언트 번들·하이드레이션 이슈 방지).
 */
export function SeoArticleJsonLd({
  url,
  headline,
  datePublished,
  description,
  authorName,
}: Props) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    datePublished,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: authorName?.trim()
      ? { "@type": "Person", name: authorName.trim() }
      : { "@type": "Organization", name: "육아박사" },
    publisher: { "@type": "Organization", name: "육아박사" },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- 구조화 데이터는 JSON-LD 전용
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
