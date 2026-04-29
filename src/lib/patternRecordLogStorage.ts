import { readLoginSession } from "@/lib/loginSession";

/**
 * 패턴 기록 클릭 로그 — `localStorage` (계정/게스트 키 분리).
 * `childIndex`: 마이 기준 아이(0~4, 아이기록과 동일). 없는 구데이터는 표시 시 0으로 본다.
 */
const PREFIX = "patternRecordLogs_v1";

export type PatternLogEntry = {
  logId: string;
  categoryId: string;
  label: string;
  atMs: number;
  childIndex?: number;
  memo?: string;
  breast?: "left" | "right" | "both";
  durationMin?: number;
  mlAmount?: number;
  weaningType?: string;
  diaperType?: "pee" | "poo" | "both";
  sleepType?: "night" | "nap";
  pumpMlLeft?: number;
  pumpMlRight?: number;
  hospitalType?: "checkup" | "illness";
  hospitalName?: string;
  hospitalDoctor?: string;
  hospitalNote?: string;
  tempC?: number;
  medName?: string;
  snackName?: string;
  snackAmount?: number;
  snackUnit?: "ml" | "g";
  playName?: string;
  playReaction?: "like" | "less-interest";
};

function key(): string {
  if (typeof window === "undefined") return `${PREFIX}__ssr`;
  const s = readLoginSession();
  const id = s?.email?.trim() ? s.email : "_guest";
  return `${PREFIX}_${encodeURIComponent(id)}`;
}

function isEntry(x: unknown): x is PatternLogEntry {
  if (x == null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.logId !== "string" ||
    typeof o.categoryId !== "string" ||
    typeof o.label !== "string" ||
    typeof o.atMs !== "number" ||
    Number.isNaN(o.atMs)
  ) {
    return false;
  }
  if (o.childIndex != null) {
    const c = o.childIndex;
    if (typeof c !== "number" || c < 0 || c > 4 || !Number.isInteger(c)) {
      return false;
    }
  }
  if (o.sleepType != null && o.sleepType !== "night" && o.sleepType !== "nap") {
    return false;
  }
  return true;
}

export function loadPatternLogs(): PatternLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key());
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(isEntry);
  } catch {
    return [];
  }
}

export const PATTERN_LOGS_UPDATED_EVENT = "patternLogsUpdated";
export const PATTERN_LOG_ADDED_EVENT = "patternLogAdded";
export const PATTERN_LOG_DELETED_EVENT = "patternLogDeleted";

export type PatternLogAddedDetail = {
  categoryId: string;
  atMs: number;
  /** 기록 시 선택된 아이 — 네비 칩이 같은 아이만 반영하도록 쓴다 */
  childIndex?: number;
  diaperType?: "pee" | "poo" | "both";
  sleepType?: "night" | "nap";
};

export type PatternLogDeletedDetail = {
  categoryId: string;
};

export function dispatchPatternLogAdded(detail: PatternLogAddedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PatternLogAddedDetail>(PATTERN_LOG_ADDED_EVENT, { detail }));
}

export function dispatchPatternLogDeleted(detail: PatternLogDeletedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PatternLogDeletedDetail>(PATTERN_LOG_DELETED_EVENT, { detail }));
}

export function savePatternLogs(list: PatternLogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(), JSON.stringify(list));
    // setTimeout으로 React 렌더 단계 완료 후 dispatch — setLogs 콜백 내부에서 호출 시 "update while rendering" 오류 방지
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(PATTERN_LOGS_UPDATED_EVENT));
    }, 0);
  } catch {
    /* ignore */
  }
}
