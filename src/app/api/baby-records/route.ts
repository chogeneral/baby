import { NextRequest, NextResponse } from "next/server";
import {
  appendBabyRecord,
  generateBabyRecordId,
  getBabyRecordsByEmail,
  type BabyRecord,
} from "@/lib/babyRecordStore";
import { findByEmail, type UserRecord } from "@/lib/userStore";

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 1000) / 1000;
}

/** 프로필에 맞는 자녀 수(1~5) — 기록 childIndex 상한 */
function getProfileChildCount(user: UserRecord): number {
  const n = user.childCount ?? user.childBirthYears?.length;
  if (n != null && n >= 1) return Math.min(5, Math.max(1, n));
  if (user.childBirthYear) return 1;
  return 1;
}

type OneInput = {
  childIndex: number;
  weightKg: number | null;
  heightCm: number | null;
  headCircumferenceCm: number | null;
  dailyNote: string;
};

function buildOneRecord(
  authorEmail: string,
  input: OneInput,
): { ok: true; record: BabyRecord } | { ok: false; message: string } {
  const hasMetric =
    input.weightKg != null ||
    input.heightCm != null ||
    input.headCircumferenceCm != null;
  if (!hasMetric && input.dailyNote.length === 0) {
    return { ok: false, message: "skip" };
  }
  const record: BabyRecord = {
    id: generateBabyRecordId(),
    authorEmail,
    childIndex: input.childIndex,
    recordedAt: new Date().toISOString(),
    weightKg: input.weightKg ?? undefined,
    heightCm: input.heightCm ?? undefined,
    headCircumferenceCm: input.headCircumferenceCm ?? undefined,
    dailyNote: input.dailyNote,
  };
  return { ok: true, record };
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("authorEmail")?.trim();
  if (!email) {
    return NextResponse.json({ message: "authorEmail이 필요합니다." }, { status: 400 });
  }
  const user = await findByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(await getBabyRecordsByEmail(email));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    authorEmail?: string;
    childIndex?: number;
    weightKg?: unknown;
    heightCm?: unknown;
    headCircumferenceCm?: unknown;
    dailyNote?: string;
    /** 자녀마다 나눠서 한 번에 저장(클라이언트 1클릭) */
    records?: Array<{
      childIndex?: number;
      weightKg?: unknown;
      heightCm?: unknown;
      headCircumferenceCm?: unknown;
      dailyNote?: string;
    }>;
  };

  const authorEmail = body.authorEmail?.trim();
  if (!authorEmail) {
    return NextResponse.json({ message: "로그인 정보가 없습니다." }, { status: 400 });
  }

  const user = await findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 401 });
  }

  const nChild = getProfileChildCount(user);

  const toAppend: BabyRecord[] = [];

  if (Array.isArray(body.records) && body.records.length > 0) {
    for (let i = 0; i < body.records.length; i += 1) {
      const row = body.records[i];
      const idx =
        row.childIndex == null
          ? 0
          : Number(row.childIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= nChild) {
        return NextResponse.json(
          { message: `${i + 1}번째 항목의 아이(인덱스)가 올바르지 않습니다. 프로필에 등록한 자녀 수를 확인해 주세요.` },
          { status: 400 },
        );
      }
      const weightKg = parseOptionalNumber(row.weightKg);
      const heightCm = parseOptionalNumber(row.heightCm);
      const headCircumferenceCm = parseOptionalNumber(row.headCircumferenceCm);
      const dailyNote = typeof row.dailyNote === "string" ? row.dailyNote.trim() : "";
      const built = buildOneRecord(authorEmail, {
        childIndex: idx,
        weightKg,
        heightCm,
        headCircumferenceCm,
        dailyNote,
      });
      if (built.ok) {
        toAppend.push(built.record);
      } else if (built.message !== "skip") {
        return NextResponse.json({ message: built.message }, { status: 400 });
      }
    }
  } else {
    const idx = body.childIndex == null ? 0 : Number(body.childIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= nChild) {
      return NextResponse.json(
        { message: "기록할 아이(인덱스)가 올바르지 않습니다. 프로필에 등록한 자녀 수를 확인해 주세요." },
        { status: 400 },
      );
    }
    const weightKg = parseOptionalNumber(body.weightKg);
    const heightCm = parseOptionalNumber(body.heightCm);
    const headCircumferenceCm = parseOptionalNumber(body.headCircumferenceCm);
    const dailyNote = typeof body.dailyNote === "string" ? body.dailyNote.trim() : "";
    const built = buildOneRecord(authorEmail, {
      childIndex: idx,
      weightKg,
      heightCm,
      headCircumferenceCm,
      dailyNote,
    });
    if (!built.ok) {
      return NextResponse.json(
        {
          message:
            built.message === "skip"
              ? "몸무게·키·머리둘레 중 하나이거나, 일상 메모를 입력해 주세요."
              : built.message,
        },
        { status: 400 },
      );
    }
    toAppend.push(built.record);
  }

  if (toAppend.length === 0) {
    return NextResponse.json(
      { message: "저장할 내용이 없어요. 아이마다 측정값이나 일상 중 하나는 적어 주세요." },
      { status: 400 },
    );
  }

  for (const r of toAppend) {
    await appendBabyRecord(r);
  }

  return NextResponse.json(
    toAppend.length === 1 ? toAppend[0]! : { saved: toAppend, count: toAppend.length },
    { status: 201 },
  );
}
