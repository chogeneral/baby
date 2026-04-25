import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findByEmail, getPrimaryChildBirthYear } from "@/lib/userStore";

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string; password?: string };
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ message: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const user = await findByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    return NextResponse.json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const primaryYear = getPrimaryChildBirthYear(user);

  const pIdx = user.primaryChildIndex ?? 0;
  return NextResponse.json({
    email: user.email,
    nickname: user.nickname ?? "",
    childBirthYear: primaryYear,
    childCount: user.childCount ?? (primaryYear != null ? 1 : 0),
    childBirthYears:
      user.childBirthYears ??
      (primaryYear != null ? [primaryYear] : []),
    childBirthDates: user.childBirthDates,
    primaryChildIndex: user.childBirthYears?.length ? pIdx : 0,
  });
}
