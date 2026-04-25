import { isPostBodyEmpty } from "@/lib/postHtmlUtils";

/** 끝에서부터 잘라 낼 `data:` 이미지 `<p>…<img>…` 블록(한 장) */
const TRAILING_DATA_IMG_P =
  /^([\s\S]*?)<p[^>]*>\s*<img[^>]+src=["']([^"']+)["'][^>]*\/?>\s*<\/p>\s*$/i;

/**
 * 에디터 HTML 뒤에 ‘하단 사진’ 블록을 붙여 저장한다(여러 장이면 `<p><img>…` 를 연속).
 * 수정 시 splitTrailingPhotosHtml 로 data URL 배열·본문을 되살릴 수 있다.
 */
export function mergeTrailingSinglePhotoHtml(
  editorHtml: string,
  photoDataUrl: string | string[] | null,
): string {
  const urls = Array.isArray(photoDataUrl)
    ? photoDataUrl
    : photoDataUrl?.trim()
      ? [photoDataUrl]
      : [];
  if (urls.length === 0) {
    return editorHtml;
  }
  const blocks = urls
    .map((u) => u?.trim())
    .filter((u): u is string => !!u)
    .map((u) => {
      const esc = u.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      return `<p><img src="${esc}" alt=""></p>`;
    })
    .join("");
  return `${editorHtml}${blocks}`;
}

/**
 * 본문 끝이 연속된 `<p><img src="data:…">` 인 경우만 에디터 본문과 data URL 배열로 나눈다(맨 끝에서부터 쌓기).
 * 예전 글(한 장)도 동일 형식이면 한 개만 배열에 담기고, 본문 중간에 img 가 있으면 분리하지 않는다(기존과 동일).
 */
export function splitTrailingPhotosHtml(html: string): {
  bodyHtml: string;
  photoDataUrls: string[];
} {
  const photoDataUrls: string[] = [];
  let rest = html.replace(/\s+$/, "");
  for (;;) {
    const m = rest.match(TRAILING_DATA_IMG_P);
    if (!m) {
      break;
    }
    let src = m[2] ?? "";
    src = src.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    if (!src.startsWith("data:image/")) {
      break;
    }
    photoDataUrls.push(src);
    rest = (m[1] ?? "").replace(/\s+$/, "");
  }
  photoDataUrls.reverse();
  return { bodyHtml: rest, photoDataUrls };
}

/**
 * 예전 1장 전용 API 호환 — 첫 장만 `photoDataUrl` 로도 돌려준다(다중이면 [0]).
 */
export function splitTrailingSinglePhotoHtml(html: string): {
  bodyHtml: string;
  photoDataUrl: string | null;
} {
  const { bodyHtml, photoDataUrls } = splitTrailingPhotosHtml(html);
  return { bodyHtml, photoDataUrl: photoDataUrls[0] ?? null };
}

/** 글자 없이 사진만 있는 글도 허용할 때 빈 글 검증에 쓴다 */
export function isMergedPostBodyEmpty(
  editorHtml: string,
  photoDataUrl: string | string[] | null,
): boolean {
  return isPostBodyEmpty(mergeTrailingSinglePhotoHtml(editorHtml, photoDataUrl));
}
