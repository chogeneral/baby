/**
 * 마이/가입 datepicker(YYYY-MM-DD) 생일 기준으로 ‘태어난 지’ 기간을 네비에 뿌린다.
 * - 한 달씩만 앞으로 가며 월 수를 세고, 마지막 월일 다음부터 오늘까지를 ‘일’로 잡는다(윤달·말일 보정은 Date가 처리).
 * - 1년 넘으면 n년 m개월 d일, 미만이면 m개월 d일(둘 다 0이면 “당일").
 */

/**
 * 생일(로컬 자정)부터 기준일까지, 완전한 ‘개월’ 수 + 그 다음 남은 ‘일’ 수
 */
function monthsAndDaysSinceBirth(
  birth: Date,
  reference: Date,
): { months: number; days: number } | null {
  if (reference < birth) {
    return null;
  }
  const cur = new Date(
    birth.getFullYear(),
    birth.getMonth(),
    birth.getDate(),
  );
  let months = 0;
  for (;;) {
    const next = new Date(cur);
    next.setMonth(next.getMonth() + 1);
    if (next > reference) {
      break;
    }
    cur.setTime(next.getTime());
    months += 1;
  }
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.floor(
    (reference.getTime() - cur.getTime()) / dayMs,
  );
  return { months, days: Math.max(0, days) };
}

/**
 * n년 m개월 d일 / m개월 d일 한 줄(네비 ‘아이기록’ 옆) — 1년(12개월) 이상이면 연도 먼저 씀(갈색은 Navbar에서)
 */
function formatNavAgeLine(months: number, days: number): string {
  if (months === 0 && days === 0) {
    return "0개월 0일";
  }
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y > 0) {
    return `${y}년 ${m}개월 ${days}일`;
  }
  return `${months}개월 ${days}일`;
}

export function getPrimaryChildAgeLabelFromIso(
  birthIso: string,
  reference = new Date(),
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthIso)) {
    return null;
  }
  const y = Number.parseInt(birthIso.slice(0, 4), 10);
  const mo = Number.parseInt(birthIso.slice(5, 7), 10);
  const d = Number.parseInt(birthIso.slice(8, 10), 10);
  const birth = new Date(y, mo - 1, d);
  if (Number.isNaN(birth.getTime()) || birth > reference) {
    return null;
  }
  const pair = monthsAndDaysSinceBirth(birth, reference);
  if (!pair) {
    return null;
  }
  return formatNavAgeLine(pair.months, pair.days);
}

/**
 * 기준 아이의 생일(YYYY-MM-DD)이 있으면 datepicker 기준, 없고 출생 ‘연도’만 있으면 1·1·1로
 * 임시 일자(레거시).
 */
export function getNavPrimaryChildAgeLabel(
  childBirthDates: string[] | undefined,
  primaryChildIndex: number | undefined,
  childBirthYears?: number[] | undefined,
  reference = new Date(),
): string | null {
  const idx = Math.max(0, primaryChildIndex ?? 0);
  const fromDate = childBirthDates?.[idx]?.trim();
  if (fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
    return getPrimaryChildAgeLabelFromIso(fromDate, reference);
  }
  const yearOnly = childBirthYears?.[idx];
  if (yearOnly == null || !Number.isFinite(yearOnly)) {
    return null;
  }
  return getPrimaryChildAgeLabelFromIso(`${yearOnly}-01-01`, reference);
}
