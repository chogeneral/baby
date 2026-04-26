import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyResetToken } from "@/lib/resetPasswordToken";
import { updateUser } from "@/lib/userStore";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { token?: string; password?: string };
  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";

  const email = verifyResetToken(token);
  if (!email) {
    return NextResponse.json(
      { message: "링크가 만료되었거나 올바르지 않습니다. 다시 요청해 주세요." },
      { status: 400 },
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { message: "비밀번호는 8자 이상으로 입력해 주세요." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const ok = await updateUser(email, { passwordHash });

  if (!ok) {
    return NextResponse.json(
      { message: "비밀번호 변경에 실패했습니다. 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "ok" });
}
