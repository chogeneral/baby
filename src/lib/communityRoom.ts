/**
 * 커뮤니티 게시판 종류(현행).
 * - babyStory: 닉네임 표시·아기이야기(구 JSON 의 youngInfant·toddler·preschool 글도 여기로 합쳐서 본다)
 * - kokkoma: 익명 꼬꼬마 게시판
 */

export type CommunityRoomKind = "babyStory" | "kokkoma";


export type LegacyAgeBoardKind = "youngInfant" | "toddler" | "preschool";

export type StoredCommunityBoardKind = CommunityRoomKind | LegacyAgeBoardKind;

/** 게시판 목록 페이지 경로 — 네비·리다이렉트에 사용 */
export const communityRoomPath: Record<CommunityRoomKind, string> = {
  babyStory: "/community/baby-story",
  kokkoma: "/community/kokkoma",
};

export const communityRoomLabels: Record<
  CommunityRoomKind,
  { roomName: string; ageHint: string; subtext?: string }
> = {
  babyStory: {
    roomName: "아기이야기",
    ageHint: "우리 아이들의 이야기를 함께 나누고 공유해요",
  },
  kokkoma: {
    roomName: "꼬꼬마",
    ageHint: "하지 못했던 이야기, 서로 이야기 해봐요 ",
    subtext:
      "누구에게도 털어놓지 못한 고민이 있나요? 당신만의 비밀 우체통이 되어 드릴게요. 마음속 무거운 짐을 이곳에 잠시 덜어보세요.",
  },
};

/**
 * 꼬꼬마 익명 게시판인지 — 목록·상세에서 닉네임 대신 익명 표기할 때 사용한다.
 */
export function isKokkomaBoard(kind: CommunityRoomKind): boolean {
  return kind === "kokkoma";
}

/**
 * 저장 포맷·구 연령방 값이 섞여 있어도 화면·필터용으로는 babyStory | kokkoma 둘 중 하나로만 본다.
 */
export function effectiveBoardKind(p: {
  boardKind?: StoredCommunityBoardKind;
  childBirthYear: number;
}): CommunityRoomKind {
  if (p.boardKind === "kokkoma") return "kokkoma";
  return "babyStory";
}

/**
 * 출생 연도 목록이 있으면 아기이야기 글쓰기·세션 기준을 잡을 수 있다는 뜻으로 babyStory 를 돌려준다.
 * (구 코드 호환을 위해 reference·primaryChildIndex 인자는 유지하나 판별에는 쓰지 않는다 — 연령별 방 분기를 없앴기 때문)
 */
export function getCommunityRoomFromBirthYears(
  birthYears: number[] | undefined,
  _reference = new Date(),
  _primaryChildIndex = 0,
): CommunityRoomKind | null {
  if (!birthYears?.length) return null;
  return "babyStory";
}
