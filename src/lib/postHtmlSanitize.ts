import sanitizeHtml from "sanitize-html";

/**
 * Vercel 서버리스는 번들 과정에서 `jsdom`(ESM)·`require()` 조합 시 `ERR_REQUIRE_ESM` 으로 터진다.
 * `sanitize-html` 은 내부적으로 `htmlparser2` 만 쓰고 DOM 이 없어도 돌아가며, 게시판 HTML 조각 세척에 흔히 쓰인다.
 * — 따라서 브라우저용 dompurify+jsdom 을 서버 SSR 에서 더 이상 쓰지 않는다.
 */
type SanitizeOpts = NonNullable<Parameters<typeof sanitizeHtml>[1]>;

/** img 의 src 허용: 래스터 data URL 만 (svg+xml 등 XSS 우회 가능성 때문에 제외 — 기존 DOMPurify 훅과 동일 정책) */
const SAFE_DATA_IMAGE_SRC = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

const SANITIZE_OPTIONS: SanitizeOpts = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "span",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "div",
    "sub",
    "sup",
    "font",
    "img",
    "hr",
  ],
  allowedAttributes: {
    "*": [
      "class",
      "style",
      "role",
      "aria-label",
      "aria-hidden",
      "aria-orientation",
    ],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading", "decoding"],
    font: ["color", "face", "size"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["data", "http", "https"],
    a: ["http", "https", "mailto", "tel"],
  },
  /** data: 스킴이라도 svg·html 인젝션을 막기 위해 실제 문자열 패턴으로 한 번 더 거른다 */
  transformTags: {
    img: (tagName, attribs) => {
      const src = (attribs.src ?? "").trim();
      if (!SAFE_DATA_IMAGE_SRC.test(src)) {
        /** 허용 src 가 아니면 img 를 제거하는 대신 빈 span 으로 치환(내용 삭제 없이 레이아웃만 안전 처리) */
        return { tagName: "span", attribs: {} };
      }
      return { tagName: "img", attribs };
    },
  },
};

/**
 * sanitize-html 이 예외를 내면(파싱 엣지 등) SSR 전체가 500 되지 않게 한다.
 */
function escapeHtmlFallback(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 게시글 본문 HTML 을 화면에 그릴 때 XSS 를 막기 위한 허용 목록.
 * BoardRichTextEditor 가 만들 수 있는 태그·속성과 인라인 이미지(data URL)만 통과시킨다.
 */
export function sanitizePostHtml(html: string | undefined | null): string {
  const safe = html == null ? "" : String(html);
  try {
    return sanitizeHtml(safe, SANITIZE_OPTIONS);
  } catch (err) {
    console.error("[sanitizePostHtml] sanitize-html 실패 — 이스케이프 폴백:", err);
    return escapeHtmlFallback(safe);
  }
}
