import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "users.json");

export type UserRecord = {
  email: string;
  nickname: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
  /** 첫째 아이 출생연도 — 게시글·레거시 API 호환용 */
  childBirthYear?: number;
  /** 자녀 수(1~5) */
  childCount?: number;
  /** 각 자녀 출생연도(순서대로) */
  childBirthYears?: number[];
  /** 각 자녀 생년월일 YYYY-MM-DD — 출생일까지 알 때 저장, 연도·방 매칭은 childBirthYears 와 동기화 */
  childBirthDates?: string[];
  /** 각 자녀 이름(호칭) — 가입 시 입력, 순서는 childBirthDates 와 같다 */
  childNames?: string[];
  /**
   * 맞춤·연령방 안내에 쓰는 기준 아이(0=첫째, 1=둘째…).
   * 없으면 0 — 기존 데이터는 첫 연도=대표로 보던 것과 동일하게 0이 기본.
   */
  primaryChildIndex?: number;
}

/** 게시글 등에 쓰는 대표 연도: primaryChildIndex 가 가리키는 아이의 출생 연도 */
export function getPrimaryChildBirthYear(user: UserRecord): number | undefined {
  const years = user.childBirthYears;
  if (years && years.length > 0) {
    const idx = Math.max(0, Math.min(user.primaryChildIndex ?? 0, years.length - 1));
    return years[idx];
  }
  return user.childBirthYear;
}

function readAll(): UserRecord[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as UserRecord[];
  } catch {
    return [];
  }
}

function writeAll(users: UserRecord[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2), "utf-8");
}

export function findByEmail(email: string): UserRecord | undefined {
  return readAll().find((u) => u.email === email);
}

export function emailExists(email: string): boolean {
  return readAll().some((u) => u.email === email);
}

export function appendUser(user: UserRecord): void {
  const users = readAll();
  users.push(user);
  writeAll(users);
}

export function updateUser(
  email: string,
  updates: Partial<
    Pick<
      UserRecord,
      | "nickname"
      | "phone"
      | "childBirthYear"
      | "passwordHash"
      | "childBirthYears"
      | "childBirthDates"
      | "childNames"
      | "childCount"
      | "primaryChildIndex"
    >
  >,
): boolean {
  const users = readAll();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return false;
  users[idx] = { ...users[idx], ...updates };
  writeAll(users);
  return true;
}
