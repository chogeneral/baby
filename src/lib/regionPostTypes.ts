/**
 * 지역(1km) 게시글 **유형** — `posts.prefix` 에 저장한다(아기이야기 말머리와 동일 컬럼, 카테고리는 `지역1km`).
 * — 옵션 변경 시 기존 글의 `prefix` 값은 그대로 두고, 수정 화면에서는 목록에 없으면 첫 항목으로 대체된다.
 */
export const REGION_POST_TYPE_OPTIONS = [
  "고민",
  "육아용품거래",
  "모임/번개",
  "정보공유",
  "소아과추천",
  "어린이집추천",
  "유치원추천",
  "이야기",
] as const;

export type RegionPostType = (typeof REGION_POST_TYPE_OPTIONS)[number];

export function isValidRegionPostType(value: string): value is RegionPostType {
  return (REGION_POST_TYPE_OPTIONS as readonly string[]).includes(value);
}
