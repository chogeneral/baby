/**
 * 게시글 본문이 HTML로 저장될 때, 금지어 검사·빈 글 검증·목록 미리보기는
 * 태그를 제거한 순수 텍스트 기준으로 처리해야 한다.
 * (브라우저가 없는 환경에서도 동작하도록 정규식 폴백을 둔다.)
 */
export function htmlToPlainText(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";

  if (typeof document !== "undefined") {
    const tmp = document.createElement("div");
    tmp.innerHTML = trimmed;
    const text = tmp.textContent ?? tmp.innerText ?? "";
    return text.replace(/\u00a0/g, " ").trim();
  }

  return trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 과거에 textarea 로 저장된 순수 텍스트 글은 태그가 없다.
 * 상세 화면에서 줄바꿈(pre-wrap)을 유지할지, sanitize HTML 로 렌더할지 나눌 때 쓴다.
 */
export function looksLikeHtmlPostBody(raw: string): boolean {
  return /<[a-z][\s\S]*>/i.test(raw.trim());
}

/**
 * 글자는 없지만 본문에 인라인 이미지만 넣은 경우도 유효한 게시글로 본다.
 * (네이버 블로그처럼 사진 위주 글을 허용하기 위함)
 */
export function isPostBodyEmpty(html: string): boolean {
  if (htmlToPlainText(html).trim().length > 0) return false;
  const trimmed = html.trim();
  if (!trimmed) return true;
  if (typeof document !== "undefined") {
    const tmp = document.createElement("div");
    tmp.innerHTML = trimmed;
    return tmp.querySelector("img") === null;
  }
  return !/<img[\s\S]*?>/i.test(trimmed);
}

/** 카드 그리드 등에서 HTML 본문을 짧게 보여 줄 때 사용한다. */
export function excerptFromHtml(html: string, maxLen: number): string {
  const t = htmlToPlainText(html);
  if (t.length > 0) {
    if (t.length <= maxLen) return t;
    return `${t.slice(0, maxLen)}…`;
  }
  if (typeof document !== "undefined") {
    const tmp = document.createElement("div");
    tmp.innerHTML = html.trim();
    if (tmp.querySelector("img")) return "사진";
  } else if (/<img[\s\S]*?>/i.test(html)) {
    return "사진";
  }
  return "";
}

/**
 * 연령방 목록 카드 썸네일용 — 저장된 HTML 안의 첫 번째 인라인(data URL) 이미지 주소를 반환한다.
 * 하단 1장 첨부(`<p><img src="data:...">`)든 본문 중간 삽입이든 DOM 순서상 첫 img 를 쓴다.
 * 브라우저가 없을 때는 정규식으로만 찾는다(SSR·테스트 호환).
 */
export function firstDataImageSrcFromPostHtml(html: string): string | null {
  const trimmed = (html ?? "").trim();
  if (!trimmed) return null;

  if (typeof document !== "undefined") {
    const tmp = document.createElement("div");
    tmp.innerHTML = trimmed;
    const el = tmp.querySelector('img[src^="data:image/"]');
    const src = el?.getAttribute("src")?.trim();
    if (src?.startsWith("data:image/")) return src;
  }

  const m = trimmed.match(/<img[^>]+src=["'](data:image\/[^"']+)["']/i);
  if (!m?.[1]) return null;
  return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
}
