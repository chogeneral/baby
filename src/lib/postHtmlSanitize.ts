import { JSDOM } from "jsdom";
import createDOMPurify, { type Config, type UponSanitizeAttributeHook } from "dompurify";

/**
 * 과거 패키지 `isomorphic-dompurify` 는 import 시점에 무조건 `new JSDOM()` 을 돌린다.
 * Vercel 서버리스·구 Node 버전 조합에서는 그 순간 크래시(상세 페이지 전부 500)가 날 수 있어,
 * `dompurify` + `jsdom` 만 직접 쓰고 **첫 sanitize 호출 때만** 창 인스턴스를 만든다.
 */
const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
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
    /* insertHorizontalRule·과거 execCommand 본문 호환 + 구분선 전용 */
    "hr",
  ],
  ALLOWED_ATTR: [
    "class",
    "style",
    "href",
    "target",
    "rel",
    "color",
    "face",
    "size",
    "src",
    "alt",
    "width",
    "height",
    "loading",
    "decoding",
    "role",
    "aria-label",
    "aria-hidden",
    "aria-orientation",
  ],
  ALLOW_DATA_ATTR: false,
};

/** img src 로 허용하는 data URL — svg+xml 은 XSS 우회가 있어 제외하고 흔한 래스터만 허용한다. */
const SAFE_DATA_IMAGE_SRC = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

const imgSrcHook: UponSanitizeAttributeHook = function (node, data) {
  if (node.nodeName !== "IMG" || data.attrName !== "src") return;
  const v = data.attrValue ?? "";
  if (!SAFE_DATA_IMAGE_SRC.test(v)) {
    data.keepAttr = false;
  }
};

let purifyInstance: ReturnType<typeof createDOMPurify> | null = null;

/** JSDOM·DOMPurify 를 지연 초기화한다 — 모듈 로드만으로는 무거운 DOM 을 만들지 않는다 */
function getPurify(): ReturnType<typeof createDOMPurify> {
  if (purifyInstance) return purifyInstance;
  const w = new JSDOM("<!DOCTYPE html>").window;
  /** dompurify 는 브라우저 Window 타입과 jsdom 의 Window 타입 명세가 완전히 같지 않아 단언이 필요하다 */
  purifyInstance = createDOMPurify(w as unknown as Parameters<typeof createDOMPurify>[0]);
  /** 인스턴스 생성 직후 한 번만 훅을 붙여, 동시 초기화 시 중복 등록 가능성을 없앤다 */
  purifyInstance.addHook("uponSanitizeAttribute", imgSrcHook);
  return purifyInstance;
}

/**
 * sanitize 가 인프라 이유로 실패할 때(메모리·Node 호환 등) 페이지 전체 SSR 이 죽지 않게 한다.
 * — 태그는 보이되 실행되지 않게 이스케이프한다(XSS 차단 우선).
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
    const purify = getPurify();
    return purify.sanitize(safe, SANITIZE_CONFIG);
  } catch (err) {
    console.error("[sanitizePostHtml] DOMPurify/JSDOM 실패 — 이스케이프 폴백:", err);
    return escapeHtmlFallback(safe);
  }
}
