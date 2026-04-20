import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findByEmail, updateUser } from "@/lib/userStore";

export async function PATCH(req: NextRequest) {
  const body = await req.json() as {
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const { email, currentPassword, newPassword } = body;

  if (!email || !currentPassword || !newPassword) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ message: "새 비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const user = findByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  const matched = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matched) {
    return NextResponse.json({ message: "현재 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  updateUser(email, { passwordHash });

  return NextResponse.json({ message: "비밀번호가 변경되었습니다." });
}
