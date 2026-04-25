import { NextRequest, NextResponse } from "next/server";
import { getBabyRecordById } from "@/lib/babyRecordStore";
import { findByEmail } from "@/lib/userStore";

/**
 * 단일 기록 조회 — 본인 `authorEmail` 과 일치할 때만 반환(타인 id 직접 추측 방지).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorEmail = req.nextUrl.searchParams.get("authorEmail")?.trim();
  if (!authorEmail) {
    return NextResponse.json({ message: "authorEmail이 필요합니다." }, { status: 400 });
  }
  const user = await findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  const record = await getBabyRecordById(id);
  if (!record || record.authorEmail !== authorEmail) {
    return NextResponse.json({ message: "기록을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(record);
}
