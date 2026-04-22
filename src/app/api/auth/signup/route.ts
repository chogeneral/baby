import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { appendUser, emailExists } from "@/lib/userStore";
import { validateChildProfilePayload } from "@/lib/validateChildProfilePayload";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    email?: string;
    nickname?: string;
    phone?: string;
    password?: string;
    childCount?: number;
    childBirthDates?: string[];
    childNames?: string[];
  };

  const { email, nickname, phone, password, childCount, childBirthDates, childNames } = body;

  const emailTrimmed = email?.trim() ?? "";
  const nicknameTrimmed = nickname?.trim() ?? "";

  if (!emailTrimmed || !nicknameTrimmed || !phone || !password) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const today = new Date();
  const maxStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const childValid = validateChildProfilePayload(
    childCount,
    childNames,
    childBirthDates,
    maxStr,
  );
  if (!childValid.ok) {
    return NextResponse.json({ message: childValid.message }, { status: 400 });
  }

  const {
    childCount: nChildren,
    trimmedNames,
    childBirthDates: datesValid,
    childBirthYears,
  } = childValid;

  if (emailExists(emailTrimmed)) {
    return NextResponse.json({ message: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  appendUser({
    email: emailTrimmed,
    nickname: nicknameTrimmed,
    phone,
    passwordHash,
    childCount: nChildren,
    childNames: trimmedNames,
    childBirthDates: datesValid,
    childBirthYears,
    childBirthYear: childBirthYears[0],
    primaryChildIndex: 0,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ message: "회원가입이 완료되었습니다." }, { status: 201 });
}
