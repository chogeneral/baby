/**
 * 발달·부모이야기 등 정적 콘텐츠 메뉴별로 나누는 주제 키.
 * API·JSON과 동일한 문자열을 쓰므로 오타로 깨지지 않게 한곳에서만 정의한다.
 */
export type ContentTopicKind = "development" | "parentStories";

/** 각 주제의 화면 제목과 글쓰기 후 돌아갈 목록 경로 */
export const contentTopicPageInfo: Record<
  ContentTopicKind,
  { title: string; subtext: string; backPath: string; writePath: string }
> = {
  development: {
    title: "발달",
    subtext: "아이마다 자라는 속도는 다르지만, 자라나는 마음은 모두 같습니다. 우리 아이만의 소중한 속도를 응원해 주세요.",
    backPath: "/development",
    writePath: "/development/write",
  },

  parentStories: {
    title: "부모 이야기",
    subtext: "완벽하지 않아도 괜찮아요. 우리 모두 처음이니까요. 당신의 솔직한 이야기를 들려주세요.",
    backPath: "/parent-stories",
    writePath: "/parent-stories/write",
  },
};
