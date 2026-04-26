import { supabase } from "./supabaseClient";

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

/**
 * supabase public.app_users 기준.
 * (구 users.json 는 더 이상 읽지 않는다 — DB 마이그레이션/시드는 별도)
 */
export async function findByEmail(
  email: string,
): Promise<UserRecord | undefined> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (error || !data) return undefined;
  return rowToUser(data as Record<string, unknown>);
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
