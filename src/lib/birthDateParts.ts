/**
 * 회원가입·프로필에서 연·월·일을 쪼개 받을 때 ISO 날짜(YYYY-MM-DD)로 합치고,
 * 해당 달의 마지막 날(윤년 포함)을 맞추기 위한 보조 함수다.
 */

/** month: 1~12 — 해당 달의 일 수 */
export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 31;
  return new Date(year, month, 0).getDate();
}

/**
 * 연·월·일 문자열(빈 문자열 제외)로 유효한 YYYY-MM-DD 를 만들거나 null(불가)을 반환한다.
 */
export function buildBirthIso(
  yearStr: string,
  monthStr: string,
  dayStr: string,
): string | null {
  const y = Number.parseInt(yearStr, 10);
  const m = Number.parseInt(monthStr, 10);
  const d = Number.parseInt(dayStr, 10);
  if (!yearStr.trim() || !monthStr.trim() || !dayStr.trim()) return null;
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  if (m < 1 || m > 12) return null;
  const maxD = getDaysInMonth(y, m);
  if (d < 1 || d > maxD) return null;
  const t = new Date(y, m - 1, d);
  if (t.getFullYear() !== y || t.getMonth() !== m - 1 || t.getDate() !== d) {
    return null;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** min ~ max(포함) 문자열은 YYYY-MM-DD 비교(동일 자릿수·형식)로 충분하다. */
export function isIsoDateInRange(iso: string, min: string, max: string) {
  return iso >= min && iso <= max;
}
