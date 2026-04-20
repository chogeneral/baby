/**
 * 출생 '연도'만 있을 때의 대략적인 육아 단계.
 * 실제 만 나이·개월은 생일이 없어서 연도 차이만 쓴다(서비스 안내용 구분에 충분하다).
 */

export type ChildAgeStage = "newborn" | "older" | "unknown";

/** 첫째 아이 기준 연도 차(올해 − 출생연도) */
export function getApproxFullYearsSinceBirth(
  birthYear: number,
  reference = new Date(),
): number {
  return reference.getFullYear() - birthYear;
}

/**
 * 만 1세 이하(연도 차이 0 또는 1): 신생아 관리 콘텐츠 추천
 * 그보다 크면: 발달·일반 콘텐츠 쪽 안내
 */
export function getChildAgeStageFromBirthYears(
  birthYears: number[] | undefined,
): ChildAgeStage {
  if (!birthYears?.length) return "unknown";
  const years = getApproxFullYearsSinceBirth(birthYears[0]);
  if (years < 0) return "unknown";
  if (years <= 1) return "newborn";
  return "older";
}
