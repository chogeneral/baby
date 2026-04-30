import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { appendUser, emailExists } from "@/lib/userStore";
import { validateChildProfilePayload } from "@/lib/validateChildProfilePayload";

export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    nickname?: string;
    phone?: string;
    password?: string;
    childCount?: number;
    childBirthDates?: string[];
    childNames?: string[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "요청 형식(JSON)이 올바르지 않습니다." }, { status: 400 });
  }

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

  if (await emailExists(emailTrimmed)) {
    return NextResponse.json({ message: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await appendUser({
      email: emailTrimmed.toLowerCase(),
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
  } catch (err) {
    /** 미들웨어·Edge 가 아닌 Node Runtime 에서 DB/SQL 에러 시 클라이언트가 빈/HTML 응답을 받지 않게 JSON 으로 내려준다 */
    const msg = err instanceof Error ? err.message : "회원 정보를 저장하지 못했습니다.";
    console.error("[signup] appendUser 실패:", err);
    return NextResponse.json({ message: msg }, { status: 500 });
  }

  return NextResponse.json({ message: "회원가입이 완료되었습니다." }, { status: 201 });
}
