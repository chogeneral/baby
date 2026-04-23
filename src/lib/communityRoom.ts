/**
 * 대표 출생 연도(첫째)만으로 방을 나눈다.
 * - 1살까지(연도 차 0~1): 영아방
 * - 2살까지(연도 차 2): 토들러방
 * - 3살~5살(연도 차 3~5): 유아방 — 6살 이상도 같은 유아방 게시판을 쓴다(미입력·서비스 단순화)
 * - kokkoma: 연령 구분 없이 참여하는 익명 전용 꼬꼬마 게시판(출생 연도 불필요)
 */

export type CommunityRoomKind =
  | "youngInfant"
  | "toddler"
  | "preschool"
  | "kokkoma";

/** 게시판 목록 페이지 경로 — 네비·리다이렉트에 사용 */
export const communityRoomPath: Record<CommunityRoomKind, string> = {
  youngInfant: "/community/young-infant",
  toddler: "/community/toddler",
  preschool: "/community/preschool",
  kokkoma: "/community/kokkoma",
};

export const communityRoomLabels: Record<
  CommunityRoomKind,
  { roomName: string; ageHint: string; subtext?: string }
> = {
  youngInfant: {
    roomName: "영아방",
    ageHint: "1살까지(만 1세 이하, 연도 기준)",
  },
  toddler: {
    roomName: "토들러방",
    ageHint: "2살까지(만 2세, 연도 기준)",
  },
  preschool: {
    roomName: "유아방",
    ageHint: "3~5살(만 3~5세, 연도 기준) · 6살 이상도 이 방에서 이용",
  },
  kokkoma: {
    roomName: "꼬꼬마",
    ageHint: "하지 못했던 이야기, 서로 이야기 해봐요 ",
    subtext: "누구에게도 털어놓지 못한 고민이 있나요? 당신만의 비밀 우체통이 되어 드릴게요. 마음속 무거운 짐을 이곳에 잠시 덜어보세요.",
  },
};

/** 연령 매칭·리다이렉트에만 쓰는 방(꼬꼬마는 제외) */
export type AgeBasedRoomKind = Exclude<CommunityRoomKind, "kokkoma">;

/**
 * 꼬꼬마 익명 게시판인지 — 목록·상세에서 닉네임 대신 익명 표기할 때 사용한다.
 */
export function isKokkomaBoard(kind: CommunityRoomKind): boolean {
  return kind === "kokkoma";
}

export function inferBoardKindFromBirthYear(
  birthYear: number,
  reference = new Date(),
): AgeBasedRoomKind {
  const diff = reference.getFullYear() - birthYear;
  /* 미래 출생 연도 등 비정상 값은 유아방 쪽으로 묶어 빈 목록을 피한다 */
  if (diff < 0) return "preschool";
  if (diff <= 1) return "youngInfant";
  if (diff === 2) return "toddler";
  return "preschool";
}

/**
 * 저장 포맷이 달라도 동일한 방 기준을 쓴다.
 * boardKind가 있으면 그대로 쓰고, 없으면 출생 연도로만 추정한다(구 데이터 호환).
 * Node 전용 postStore와 분리해 클라이언트 컴포넌트에서도 안전하게 import 가능하다.
 */
export function effectiveBoardKind(p: {
  boardKind?: CommunityRoomKind;
  childBirthYear: number;
}): CommunityRoomKind {
  if (p.boardKind) return p.boardKind;
  return inferBoardKindFromBirthYear(p.childBirthYear);
}

/**
 * @param primaryChildIndex — childBirthYears 중 몇 번째를 연령 방 판정에 쓸지(기본 0=첫째)
 */
export function getCommunityRoomFromBirthYears(
  birthYears: number[] | undefined,
  reference = new Date(),
  primaryChildIndex = 0,
): AgeBasedRoomKind | null {
  if (!birthYears?.length) return null;
  const idx = Math.max(0, Math.min(primaryChildIndex, birthYears.length - 1));
  return inferBoardKindFromBirthYear(birthYears[idx], reference);
}
