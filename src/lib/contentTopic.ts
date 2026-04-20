/**
 * 발달·육아용품·부모이야기 등 정적 콘텐츠 메뉴별로 나누는 주제 키.
 * API·JSON과 동일한 문자열을 쓰므로 오타로 깨지지 않게 한곳에서만 정의한다.
 */
export type ContentTopicKind = "development" | "parentingSupplies" | "parentStories";

/** 각 주제의 화면 제목과 글쓰기 후 돌아갈 목록 경로 */
export const contentTopicPageInfo: Record<
  ContentTopicKind,
  { title: string; backPath: string; writePath: string }
> = {
  development: {
    title: "발달",
    backPath: "/development",
    writePath: "/development/write",
  },
  parentingSupplies: {
    title: "육아용품",
    backPath: "/parenting-supplies",
    writePath: "/parenting-supplies/write",
  },
  parentStories: {
    title: "부모 이야기",
    backPath: "/parent-stories",
    writePath: "/parent-stories/write",
  },
};
