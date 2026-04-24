/**
 * SEO용 절대 URL(base) — `metadataBase`, sitemap, robots.txt 에서 공통으로 쓴다.
 * 프로덕션 도메인은 배포 환경에 `NEXT_PUBLIC_SITE_URL`(예: https://example.com, 끝 슬래시 없음)로 넣는다.
 * Vercel 은 `VERCEL_URL` 이 잡혀 있으면 `https://...` 로 보완해 미리보기·스테이징에도 쓸 수 있다.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
