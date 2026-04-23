import { isPostBodyEmpty } from "@/lib/postHtmlUtils";

/**
 * 에디터 HTML 뒤에 ‘하단 사진 1장’ 블록을 붙여 저장한다.
 * 수정 화면에서 splitTrailingSinglePhotoHtml 로 다시 떼어 낼 수 있게 형식을 맞춘다.
 */
export function mergeTrailingSinglePhotoHtml(
  editorHtml: string,
  photoDataUrl: string | null,
): string {
  if (!photoDataUrl?.trim()) return editorHtml;
  const esc = photoDataUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `${editorHtml}<p><img src="${esc}" alt=""></p>`;
}

/**
 * 저장된 본문 끝이 `<p><img src="data:..."></p>` 한 덩어리면 에디터용 본문과 사진 URL 로 나눈다.
 * 예전 글(본문 안에 여러 img)은 분리하지 않고 전부 editor 로 둔다.
 */
export function splitTrailingSinglePhotoHtml(html: string): {
  bodyHtml: string;
  photoDataUrl: string | null;
} {
  const trimmed = html.replace(/\s+$/, "");
  const m = trimmed.match(
    /^([\s\S]*?)<p[^>]*>\s*<img[^>]+src=["']([^"']+)["'][^>]*\/?>\s*<\/p>\s*$/i,
  );
  if (!m) return { bodyHtml: html, photoDataUrl: null };
  const bodyHtml = (m[1] ?? "").replace(/\s+$/, "");
  let src = m[2] ?? "";
  src = src.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  if (!src.startsWith("data:image/")) return { bodyHtml: html, photoDataUrl: null };
  return { bodyHtml, photoDataUrl: src };
}

/** 글자 없이 사진만 있는 글도 허용할 때 빈 글 검증에 쓴다 */
export function isMergedPostBodyEmpty(
  editorHtml: string,
  photoDataUrl: string | null,
): boolean {
  return isPostBodyEmpty(mergeTrailingSinglePhotoHtml(editorHtml, photoDataUrl));
}
