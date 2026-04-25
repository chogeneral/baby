import { supabase } from "./supabaseClient";

const TABLE = "baby_records";

export type BabyRecord = {
  id: string;
  authorEmail: string;
  recordedAt: string;
  childIndex?: number;
  weightKg?: number | null;
  heightCm?: number | null;
  headCircumferenceCm?: number | null;
  dailyNote: string;
};

function rowToRecord(row: Record<string, unknown>): BabyRecord {
  return {
    id: String(row.id),
    authorEmail: String(row.author_email),
    recordedAt: row.recorded_at as string,
    childIndex: (row.child_index as number) ?? 0,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
    heightCm: row.height_cm != null ? Number(row.height_cm) : undefined,
    headCircumferenceCm:
      row.head_circumference_cm != null
        ? Number(row.head_circumference_cm)
        : undefined,
    dailyNote: String(row.daily_note ?? ""),
  };
}

export async function appendBabyRecord(record: BabyRecord): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    id: record.id,
    author_email: record.authorEmail,
    recorded_at: record.recordedAt,
    child_index: record.childIndex ?? 0,
    weight_kg: record.weightKg ?? null,
    height_cm: record.heightCm ?? null,
    head_circumference_cm: record.headCircumferenceCm ?? null,
    daily_note: record.dailyNote,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function getBabyRecordsByEmail(
  email: string,
): Promise<BabyRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("author_email", email)
    .order("recorded_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToRecord);
}

export async function getBabyRecordById(
  id: string,
): Promise<BabyRecord | undefined> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return undefined;
  return rowToRecord(data as Record<string, unknown>);
}

export function generateBabyRecordId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
