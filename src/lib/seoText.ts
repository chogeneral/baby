/**
 * HTML 본문을 검색/OG description 용으로 줄이기(태그·스크립트 제거 후 잘라서 …).
 * 서버(메타 태그)에서 쓰므로 DOM API 없이 정규식만 쓴다.
 */
export function toPlainTextExcerpt(html: string, maxLen = 155): string {
  if (!html?.trim()) return "";
  const text = String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}
