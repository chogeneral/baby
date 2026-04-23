import DOMPurify from "isomorphic-dompurify";

/** isomorphic-dompurify 가 네임스페이스 타입을 노출하지 않을 때를 대비해 sanitize 두 번째 인자 타입을 쓴다 */
type DomPurifyConfig = NonNullable<Parameters<typeof DOMPurify.sanitize>[1]>;

/**
 * img src 로 허용하는 data URL — svg+xml 은 XSS 우회가 있어 제외하고 흔한 래스터만 허용한다.
 */
const SAFE_DATA_IMAGE_SRC = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

let imgSrcHookRegistered = false;

/**
 * DOMPurify 훅은 모듈당 한 번만 등록한다(HMR 시 중복 등록을 피하기 위함).
 * img 의 src 는 안전한 data:image base64 만 통과시킨다.
 */
function ensureImgSrcHook(): void {
  if (imgSrcHookRegistered) return;
  imgSrcHookRegistered = true;
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (node.nodeName !== "IMG" || data.attrName !== "src") return;
    const v = data.attrValue ?? "";
    if (!SAFE_DATA_IMAGE_SRC.test(v)) {
      data.keepAttr = false;
    }
  });
}

/**
 * 게시글 본문 HTML 을 화면에 그릴 때 XSS 를 막기 위한 허용 목록.
 * BoardRichTextEditor 가 만들 수 있는 태그·속성과 인라인 이미지(data URL)만 통과시킨다.
 */
const SANITIZE_CONFIG: DomPurifyConfig = {
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
  ],
  ALLOWED_ATTR: [
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
  ],
  ALLOW_DATA_ATTR: false,
};

export function sanitizePostHtml(html: string): string {
  ensureImgSrcHook();
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}
