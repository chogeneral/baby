import { supabase } from "./supabase";
import { type PatternLogEntry, isPatternLogEntry } from "./patternRecordLogStorage";

const TABLE = "pattern_logs";

/** Supabase 행(snake_case) ↔ 앱 PatternLogEntry — DB 컬럼명과 1:1 대응 */
type PatternLogRow = {
  user_email: string;
  log_id: string;
  category_id: string;
  label: string;
  at_ms: number;
  child_index: number;
  memo: string | null;
  breast: string | null;
  duration_min: number | string | null;
  ml_amount: number | string | null;
  weaning_type: string | null;
  diaper_type: string | null;
  sleep_type: string | null;
  pump_ml_left: number | string | null;
  pump_ml_right: number | string | null;
  hospital_type: string | null;
  hospital_name: string | null;
  hospital_doctor: string | null;
  hospital_note: string | null;
  temp_c: number | string | null;
  med_name: string | null;
  snack_name: string | null;
  snack_amount: number | string | null;
  snack_unit: string | null;
  play_name: string | null;
  play_reaction: string | null;
};

function numOrUndef(x: number | string | null | undefined): number | undefined {
  if (x == null) return undefined;
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : undefined;
}

export function patternLogEntryToRow(userEmail: string, e: PatternLogEntry): PatternLogRow {
  return {
    user_email: userEmail,
    log_id: e.logId,
    category_id: e.categoryId,
    label: e.label,
    at_ms: e.atMs,
    child_index: e.childIndex ?? 0,
    memo: e.memo ?? null,
    breast: e.breast ?? null,
    duration_min: e.durationMin ?? null,
    ml_amount: e.mlAmount ?? null,
    weaning_type: e.weaningType ?? null,
    diaper_type: e.diaperType ?? null,
    sleep_type: e.sleepType ?? null,
    pump_ml_left: e.pumpMlLeft ?? null,
    pump_ml_right: e.pumpMlRight ?? null,
    hospital_type: e.hospitalType ?? null,
    hospital_name: e.hospitalName ?? null,
    hospital_doctor: e.hospitalDoctor ?? null,
    hospital_note: e.hospitalNote ?? null,
    temp_c: e.tempC ?? null,
    med_name: e.medName ?? null,
    snack_name: e.snackName ?? null,
    snack_amount: e.snackAmount ?? null,
    snack_unit: e.snackUnit ?? null,
    play_name: e.playName ?? null,
    play_reaction: e.playReaction ?? null,
  };
}

export function patternLogRowToEntry(row: Record<string, unknown>): PatternLogEntry | null {
  const o: Record<string, unknown> = {
    logId: row.log_id,
    categoryId: row.category_id,
    label: row.label,
    atMs: row.at_ms,
    childIndex: row.child_index,
    memo: row.memo ?? undefined,
    breast: row.breast ?? undefined,
    durationMin: numOrUndef(row.duration_min as number | string | null),
    mlAmount: numOrUndef(row.ml_amount as number | string | null),
    weaningType: row.weaning_type ?? undefined,
    diaperType: row.diaper_type ?? undefined,
    sleepType: row.sleep_type ?? undefined,
    pumpMlLeft: numOrUndef(row.pump_ml_left as number | string | null),
    pumpMlRight: numOrUndef(row.pump_ml_right as number | string | null),
    hospitalType: row.hospital_type ?? undefined,
    hospitalName: row.hospital_name ?? undefined,
    hospitalDoctor: row.hospital_doctor ?? undefined,
    hospitalNote: row.hospital_note ?? undefined,
    tempC: numOrUndef(row.temp_c as number | string | null),
    medName: row.med_name ?? undefined,
    snackName: row.snack_name ?? undefined,
    snackAmount: numOrUndef(row.snack_amount as number | string | null),
    snackUnit: row.snack_unit ?? undefined,
    playName: row.play_name ?? undefined,
    playReaction: row.play_reaction ?? undefined,
  };
  if (o.breast != null && o.breast !== "left" && o.breast !== "right" && o.breast !== "both") {
    delete o.breast;
  }
  return isPatternLogEntry(o) ? (o as PatternLogEntry) : null;
}

export async function getPatternLogsByEmail(email: string): Promise<PatternLogEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "log_id, category_id, label, at_ms, child_index, memo, breast, duration_min, ml_amount, weaning_type, diaper_type, sleep_type, pump_ml_left, pump_ml_right, hospital_type, hospital_name, hospital_doctor, hospital_note, temp_c, med_name, snack_name, snack_amount, snack_unit, play_name, play_reaction",
    )
    .eq("user_email", email)
    .order("at_ms", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  const out: PatternLogEntry[] = [];
  for (const row of data ?? []) {
    const e = patternLogRowToEntry(row as Record<string, unknown>);
    if (e) out.push(e);
  }
  return out;
}

/**
 * 해당 계정 로그를 전부 바꾼다(로컬 배열과 동일 스냅샷) — 멀티 디바이스 동기용.
 * 트랜잭션 없이 delete 후 insert; RLS/anon 환경에서만 사용한다.
 */
export async function replacePatternLogsForUser(
  userEmail: string,
  logs: PatternLogEntry[],
): Promise<void> {
  const { error: delErr } = await supabase.from(TABLE).delete().eq("user_email", userEmail);
  if (delErr) {
    throw new Error(delErr.message);
  }
  if (logs.length === 0) return;

  const rows = logs.map((e) => patternLogEntryToRow(userEmail, e));
  const chunk = 200;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const { error: insErr } = await supabase.from(TABLE).insert(part as never[]);
    if (insErr) {
      throw new Error(insErr.message);
    }
  }
}
