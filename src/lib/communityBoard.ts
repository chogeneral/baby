/** 커뮤니티 게시판 공식 이름 — 네비·목록·글쓰기에서 동일하게 쓴다 */
export const communityBoardTitle = "당나귀 귀";

/** 네비 등 짧은 표기 — 닉네임이 글·댓글에 노출된다는 점을 짧게 드러낸다 */
export const communityBoardShortLabel = "당나귀 귀(닉네임 표시)";

/**
 * 글·댓글 작성자 표시용: API에서 닉네임이 비어 오면(미설정 등) UI가 비지 않도록
 * 동일한 대체 문구를 쓴다.
 */
export function displayCommunityNickname(nickname: string | undefined | null): string {
  const trimmed = (nickname ?? "").trim();
  return trimmed.length > 0 ? trimmed : "회원";
}
