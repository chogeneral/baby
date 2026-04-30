import { supabase } from "./supabase";

const TABLE = "app_users";

export type UserRecord = {
  email: string;
  nickname: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
  childBirthYear?: number;
  childCount?: number;
  childBirthYears?: number[];
  childBirthDates?: string[];
  childNames?: string[];
  primaryChildIndex?: number;
};

/** getPrimaryChildBirthYear 는 동기 순수함수이므로 그대로 쓴다 */
export function getPrimaryChildBirthYear(user: UserRecord): number | undefined {
  const years = user.childBirthYears;
  if (years && years.length > 0) {
    const idx = Math.max(0, Math.min(user.primaryChildIndex ?? 0, years.length - 1));
    return years[idx];
  }
  return user.childBirthYear;
}

function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    email: String(row.email),
    nickname: (row.nickname as string) ?? "",
    phone: (row.phone as string) ?? "",
    passwordHash: String(row.password_hash ?? ""),
    createdAt: row.created_at as string,
    childBirthYear: (row.child_birth_year as number) ?? undefined,
    childCount: (row.child_count as number) ?? undefined,
    childBirthYears: (row.child_birth_years as number[] | null) ?? undefined,
    childBirthDates: (row.child_birth_dates as string[] | null) ?? undefined,
    childNames: (row.child_names as string[] | null) ?? undefined,
    primaryChildIndex: (row.primary_child_index as number) ?? undefined,
  };
}

type FetchUserRowByEmailResult =
  | { ok: true; row: Record<string, unknown> | null }
  | { ok: false; errorMessage: string };

/**
 * 이메일로 app_users 행을 한 번만 조회한다.
 * — findByEmail / 로그인 전용 lookup 가 같은 쿼리를 공유해 RLS·네트워크 오류 처리를 일관되게 한다.
 */
async function fetchUserRowByEmail(email: string): Promise<FetchUserRowByEmailResult> {
  const normalized = email.toLowerCase().trim();
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("email", normalized)
      .maybeSingle();
    if (error) {
      console.warn("[userStore] fetchUserRowByEmail Supabase 오류:", error.message);
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true, row: data as Record<string, unknown> | null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[userStore] fetchUserRowByEmail 예외:", err);
    return { ok: false, errorMessage: msg };
  }
}

/**
 * supabase public.app_users 기준.
 * (구 users.json 는 더 이상 읽지 않는다 — DB 마이그레이션/시드는 별도)
 */
export async function findByEmail(
  email: string,
): Promise<UserRecord | undefined> {
  const r = await fetchUserRowByEmail(email);
  if (!r.ok) return undefined;
  if (!r.row) return undefined;
  return rowToUser(r.row);
}

/**
 * 로그인 API 전용: Supabase 조회 실패(키·RLS·네트워크)와 "해당 이메일 없음"을 분리한다.
 * — 전자는 401로 숨기면 로컬 개발 시 원인(환경변수·마이그레이션 미적용)을 찾기 어렵기 때문이다.
 */
export type LoginLookupResult =
  | { status: "ok"; user: UserRecord }
  | { status: "not_found" }
  | { status: "db_error"; message: string };

export async function lookupUserForLogin(email: string): Promise<LoginLookupResult> {
  const r = await fetchUserRowByEmail(email);
  if (!r.ok) return { status: "db_error", message: r.errorMessage };
  if (!r.row) return { status: "not_found" };
  return { status: "ok", user: rowToUser(r.row) };
}

export async function findByPhone(phone: string): Promise<UserRecord | undefined> {
  const digits = phone.replace(/\D/g, "");
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("phone", digits)
    .maybeSingle();
  if (error || !data) return undefined;
  return rowToUser(data as Record<string, unknown>);
}

export async function emailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error) return false;
  return data != null;
}

export async function appendUser(user: UserRecord): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    email: user.email.toLowerCase().trim(),
    nickname: user.nickname,
    phone: user.phone,
    password_hash: user.passwordHash,
    created_at: user.createdAt,
    child_birth_year: user.childBirthYear ?? null,
    child_count: user.childCount ?? null,
    child_birth_years: user.childBirthYears ?? null,
    child_birth_dates: user.childBirthDates ?? null,
    child_names: user.childNames ?? null,
    primary_child_index: user.primaryChildIndex ?? 0,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateUser(
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
): Promise<boolean> {
  const row: Record<string, unknown> = {};
  if (updates.nickname !== undefined) row.nickname = updates.nickname;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.childBirthYear !== undefined) row.child_birth_year = updates.childBirthYear;
  if (updates.passwordHash !== undefined) row.password_hash = updates.passwordHash;
  if (updates.childBirthYears !== undefined) row.child_birth_years = updates.childBirthYears;
  if (updates.childBirthDates !== undefined) row.child_birth_dates = updates.childBirthDates;
  if (updates.childNames !== undefined) row.child_names = updates.childNames;
  if (updates.childCount !== undefined) row.child_count = updates.childCount;
  if (updates.primaryChildIndex !== undefined) {
    row.primary_child_index = updates.primaryChildIndex;
  }
  if (Object.keys(row).length === 0) return true;

  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq("email", email.toLowerCase().trim())
    .select("email");
  if (error || !data?.length) return false;
  return true;
}
