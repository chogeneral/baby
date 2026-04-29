import { readLoginSession } from "@/lib/loginSession";
import { isSupabaseConfigured } from "@/lib/supabase";

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

export function isPatternLogEntry(x: unknown): x is PatternLogEntry {
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

function isEntry(x: unknown): x is PatternLogEntry {
  return isPatternLogEntry(x);
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

export function savePatternLogs(
  list: PatternLogEntry[],
  options?: { skipRemotePush?: boolean },
): void {
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

  /*
   * Supabase 가 설정되어 있고 로그인된 경우에만 서버에 스냅샷을 올린다.
   * skipRemotePush 로 채운 데이터를 다시 PUT 하면 불필요한 왕복이 생기므로 생략한다.
   */
  if (options?.skipRemotePush) {
    return;
  }
  const session = readLoginSession();
  const email = session?.email?.trim();
  if (!email || !isSupabaseConfigured()) {
    return;
  }
  void fetch("/api/pattern-logs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorEmail: email, logs: list }),
  })
    .then(async (res) => {
      if (res.ok) return;
      const text = await res.text().catch(() => "");
      /* 브라우저 콘솔에서 401(미가입)·500(DB·RLS)·400 검증 실패 등을 바로 볼 수 있게 한다 */
      console.warn("[pattern-logs] 동기화 실패:", res.status, text.slice(0, 300));
    })
    .catch(() => {});
}

/**
 * 서버(Supabase)에서 패턴 로그를 내려받아 localStorage에 반영한다.
 * - 서버에 한 건도 없고 로컬만 있으면 로컬을 한 번 올려 마이그레이션한다(기존 단일 기기 사용자).
 * - 로그인·NEXT_PUBLIC Supabase 가 없으면 아무 것도 하지 않는다.
 */
export async function pullPatternLogsForSession(): Promise<void> {
  if (typeof window === "undefined") return;
  const session = readLoginSession();
  const email = session?.email?.trim();
  if (!email || !isSupabaseConfigured()) {
    return;
  }
  try {
    const res = await fetch(`/api/pattern-logs?authorEmail=${encodeURIComponent(email)}`);
    if (!res.ok) return;
    const remoteRaw = (await res.json()) as unknown;
    if (!Array.isArray(remoteRaw)) return;
    const parsed: PatternLogEntry[] = remoteRaw.filter(isEntry);
    const local = loadPatternLogs();
    if (parsed.length === 0 && local.length > 0) {
      await fetch("/api/pattern-logs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorEmail: email, logs: local }),
      });
      return;
    }
    savePatternLogs(parsed, { skipRemotePush: true });
  } catch {
    /* 오프라인·오류 시 로컬 유지 */
  }
}
