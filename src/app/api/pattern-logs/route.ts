import { NextRequest, NextResponse } from "next/server";
import { findByEmail, type UserRecord } from "@/lib/userStore";
import { getPatternLogsByEmail, replacePatternLogsForUser } from "@/lib/patternLogStore";
import { isPatternLogEntry, type PatternLogEntry } from "@/lib/patternRecordLogStorage";

/** baby-records API 와 동일: 프로필 기준 자녀 수(1~5) — childIndex 상한 */
function getProfileChildCount(user: UserRecord): number {
  const n = user.childCount ?? user.childBirthYears?.length;
  if (n != null && n >= 1) return Math.min(5, Math.max(1, n));
  if (user.childBirthYear) return 1;
  return 1;
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
  try {
    const logs = await getPatternLogsByEmail(email);
    return NextResponse.json(logs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "조회 실패";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as { authorEmail?: string; logs?: unknown };
  const authorEmail = body.authorEmail?.trim();
  if (!authorEmail) {
    return NextResponse.json({ message: "authorEmail이 필요합니다." }, { status: 400 });
  }
  const user = await findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 401 });
  }
  if (!Array.isArray(body.logs)) {
    return NextResponse.json({ message: "logs 배열이 필요합니다." }, { status: 400 });
  }
  if (body.logs.length > 5000) {
    return NextResponse.json(
      { message: "한 번에 저장할 수 있는 개수를 초과했습니다." },
      { status: 400 },
    );
  }
  const nChild = getProfileChildCount(user);
  const logs: PatternLogEntry[] = [];
  for (let i = 0; i < body.logs.length; i++) {
    const item = body.logs[i];
    if (!isPatternLogEntry(item)) {
      return NextResponse.json(
        { message: `${i + 1}번째 항목 형식이 올바르지 않습니다.` },
        { status: 400 },
      );
    }
    const c = item.childIndex ?? 0;
    if (!Number.isInteger(c) || c < 0 || c >= nChild) {
      return NextResponse.json(
        { message: `${i + 1}번째 항목의 아이 인덱스가 프로필과 맞지 않습니다.` },
        { status: 400 },
      );
    }
    logs.push(item);
  }
  const ids = new Set<string>();
  for (const l of logs) {
    if (ids.has(l.logId)) {
      return NextResponse.json({ message: "logId 가 중복되었습니다." }, { status: 400 });
    }
    ids.add(l.logId);
  }
  try {
    await replacePatternLogsForUser(authorEmail, logs);
    return NextResponse.json({ ok: true, count: logs.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
