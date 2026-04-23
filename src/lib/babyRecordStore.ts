import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "babyRecords.json");

/**
 * 아기 성장·일상 기록 한 건 — 데모용으로 data/babyRecords.json 에 누적 저장한다.
 */
export type BabyRecord = {
  id: string;
  authorEmail: string;
  recordedAt: string;
  /**
   * 마이·가입에 등록한 자녀 순서 인덱스(0=첫째) — 필드가 없는 옛 기록은 0으로 취급
   */
  childIndex?: number;
  /** kg, 소수 허용 */
  weightKg?: number | null;
  /** cm */
  heightCm?: number | null;
  /** cm */
  headCircumferenceCm?: number | null;
  /** 오늘의 일상 메모 */
  dailyNote: string;
};

function readAll(): BabyRecord[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as BabyRecord[];
  } catch {
    return [];
  }
}

function writeAll(rows: BabyRecord[]) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(rows, null, 2), "utf-8");
}

export function appendBabyRecord(record: BabyRecord) {
  const rows = readAll();
  rows.push(record);
  writeAll(rows);
}

/** 최신순으로 해당 이메일 기록만 반환 */
export function getBabyRecordsByEmail(email: string): BabyRecord[] {
  return readAll()
    .filter((r) => r.authorEmail === email)
    .slice()
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
}

/** id 로 한 건만 조회 — 상세 API·화면에서 사용 */
export function getBabyRecordById(id: string): BabyRecord | undefined {
  return readAll().find((r) => r.id === id);
}

export function generateBabyRecordId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
