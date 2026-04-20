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
};

/** 게시글 등에 쓰는 대표 연도: 다자녀면 첫째 기준 */
export function getPrimaryChildBirthYear(user: UserRecord): number | undefined {
  if (user.childBirthYears && user.childBirthYears.length > 0) {
    return user.childBirthYears[0];
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
    Pick<UserRecord, "nickname" | "phone" | "childBirthYear" | "passwordHash" | "childBirthYears" | "childCount">
  >,
): boolean {
  const users = readAll();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return false;
  users[idx] = { ...users[idx], ...updates };
  writeAll(users);
  return true;
}
