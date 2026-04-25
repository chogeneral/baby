/**
 * 부모이야기·정보 등 정적 콘텐츠 메뉴별로 나누는 주제 키.
 * Supabase `content_topic_posts.topic` 및 API·클라이언트에서 **한글**로 통일한다.
 */
export type ContentTopicKind = "부모이야기" | "정보";

/**
 * 부모이야기·정보 게시판에 ‘새 글’을 등록할 수 있는 계정(단일).
 * 목록의 글쓰기 버튼 노출, 글쓰기 페이지 진입, API POST 가 모두 이 이메일과 일치하는지 검사해
 * URL 직접 입력으로 우회하는 것을 막는다.
 */
export const contentTopicWriteAllowedEmail = "s2ckh1005@gmail.com";

/** 세션/API 에서 넘어온 이메일이 위 허용 목록과 같은지(대소문자 무시) */
export function isContentTopicWriteAllowedEmail(
  email: string | null | undefined,
): boolean {
  if (!email?.trim()) return false;
  return (
    email.trim().toLowerCase() === contentTopicWriteAllowedEmail.toLowerCase()
  );
}

/**
 * 쿼리/POST body 등에서 온 문자열을 `ContentTopicKind` 로 통일한다.
 * 구 API·북마크 호환: `parentStories` → 부모이야기, `info` → 정보
 */
export function normalizeContentTopicInput(raw: string): ContentTopicKind | null {
  const t = raw.trim();
  if (t === "부모이야기" || t === "parentStories") return "부모이야기";
  if (t === "정보" || t === "info") return "정보";
  return null;
}

/**
 * 각 주제의 화면 제목·리드 문구·목록/글쓰기 경로
 * - detailTagLabel: 상세 h1 **위**에 붙이는 짧은 게시판명(커뮤니티 `nestTagLg`·네비와 맞춤)
 */
export const contentTopicPageInfo: Record<
  ContentTopicKind,
  {
    title: string;
    subtext: string;
    backPath: string;
    writePath: string;
    /** 상세에서만 h1 직상 표시; 없으면 아기이야기 상세의 게시판 띠와 동일한 블록을 쓰지 않는다 */
    detailTagLabel?: string;
  }
> = {
  부모이야기: {
    title: "부모 이야기",
    subtext: "완벽하지 않아도 괜찮아요. 우리 모두 처음이니까요. 당신의 솔직한 이야기를 들려주세요.",
    backPath: "/parent-stories",
    writePath: "/parent-stories/write",
    detailTagLabel: "부모이야기",
  },

  정보: {
    title: "정보",
    subtext:
      "육아와 가족 생활에 도움이 되는 안내·자료·팁을 차분히 모아 두는 공간이에요.",
    backPath: "/info",
    writePath: "/info/write",
    detailTagLabel: "정보",
  },
};

/**
 * 주제 키를 URL 첫 경로 세그먼트로 바꾼다.
 * 부모이야기만 폴더명이 kebab-case(parent-stories)라 예외로 매핑하고, 나머지는 그대로 쓴다.
 */
export function contentTopicUrlSegment(topic: ContentTopicKind): string {
  switch (topic) {
    case "부모이야기":
      return "parent-stories";
    case "정보":
      return "info";
  }
}

/** 상세 페이지 경로 — 목록·수정 취소·수정 완료 후 이동에 공통 사용 */
export function contentTopicDetailPath(topic: ContentTopicKind, id: string): string {
  return `/${contentTopicUrlSegment(topic)}/${id}`;
}

/**
 * 수정 페이지 경로 — 비밀번호 확인 후에는 쿼리로 pw를 넘겨 편집 폼이 권한을 검증한다.
 */
export function contentTopicEditPath(
  topic: ContentTopicKind,
  id: string,
  passwordForQuery?: string,
): string {
  const base = `${contentTopicDetailPath(topic, id)}/edit`;
  if (passwordForQuery != null && passwordForQuery !== "") {
    return `${base}?pw=${encodeURIComponent(passwordForQuery)}`;
  }
  return base;
}
