/**
 * 패턴 기록 페이지에서 고른 ‘현재 아이’ 탭 인덱스를 sessionStorage에만 둔다.
 * 네비 마지막 수유/이유식 등 칩은 로그의 childIndex 와 이 값(없으면 마이의 primaryChildIndex)을 맞춰
 * 보여 주는 목록과 동일한 아이만 반영한다 — 다른 아이 데이터가 새로고침 후 다시 칩으로 뜨는 문제 방지.
 */
const storageKey = "patternRecordActiveChildIndex_v1";

export const PATTERN_RECORD_ACTIVE_CHILD_CHANGED_EVENT =
  "patternRecordActiveChildChanged";

export function readPatternRecordActiveChildIndex(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 4) return null;
    return n;
  } catch {
    return null;
  }
}

/** 탭 변경 시 호출 — Navbar 등 다른 영역이 칩을 다시 맞추도록 커스텀 이벤트를 쏜다 */
export function writePatternRecordActiveChildIndex(childIndex: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(childIndex) || childIndex < 0 || childIndex > 4) {
    return;
  }
  try {
    window.sessionStorage.setItem(storageKey, String(childIndex));
    window.dispatchEvent(new Event(PATTERN_RECORD_ACTIVE_CHILD_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}
