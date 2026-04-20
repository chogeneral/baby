import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { appendUser, emailExists } from "@/lib/userStore";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    email?: string;
    nickname?: string;
    phone?: string;
    password?: string;
    childCount?: number;
    childBirthYears?: number[];
  };

  const { email, nickname, phone, password, childCount, childBirthYears } = body;

  const emailTrimmed = email?.trim() ?? "";
  const nicknameTrimmed = nickname?.trim() ?? "";

  if (!emailTrimmed || !nicknameTrimmed || !phone || !password) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  if (
    childCount == null ||
    typeof childCount !== "number" ||
    !Array.isArray(childBirthYears) ||
    childBirthYears.length !== childCount
  ) {
    return NextResponse.json(
      { message: "자녀 수와 출생 연도 정보가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (childCount < 1 || childCount > 5) {
    return NextResponse.json({ message: "자녀 수는 1명~5명만 가능합니다." }, { status: 400 });
  }

  const currentYear = new Date().getFullYear();
  for (let i = 0; i < childBirthYears.length; i++) {
    const y = childBirthYears[i];
    if (typeof y !== "number" || Number.isNaN(y) || y < 1990 || y > currentYear) {
      return NextResponse.json(
        { message: `${i + 1}번째 아이의 출생 연도가 올바르지 않습니다.` },
        { status: 400 },
      );
    }
  }

  if (emailExists(emailTrimmed)) {
    return NextResponse.json({ message: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  appendUser({
    email: emailTrimmed,
    nickname: nicknameTrimmed,
    phone,
    passwordHash,
    childCount,
    childBirthYears,
    /* 기존 단일 필드 API·게시글과 호환되도록 첫째 연도를 넣는다 */
    childBirthYear: childBirthYears[0],
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ message: "회원가입이 완료되었습니다." }, { status: 201 });
}
