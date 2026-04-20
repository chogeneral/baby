import { NextRequest, NextResponse } from "next/server";
import { findByEmail, getPrimaryChildBirthYear, updateUser } from "@/lib/userStore";
import { isValidKoreanMobile } from "@/lib/formatKoreanPhone";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ message: "이메일이 필요합니다." }, { status: 400 });
  }

  const user = findByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    email: user.email,
    nickname: user.nickname,
    phone: user.phone,
    childBirthYear: getPrimaryChildBirthYear(user),
    childBirthYears: user.childBirthYears,
    childCount: user.childCount,
    createdAt: user.createdAt,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as {
    email?: string;
    nickname?: string;
    phone?: string;
    childBirthYear?: number;
  };

  const { email, nickname, phone, childBirthYear } = body;

  if (!email) {
    return NextResponse.json({ message: "이메일이 필요합니다." }, { status: 400 });
  }

  if (!findByEmail(email)) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  const updates: Parameters<typeof updateUser>[1] = {};

  if (nickname !== undefined) {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      return NextResponse.json({ message: "닉네임은 2~20자로 입력해 주세요." }, { status: 400 });
    }
    updates.nickname = trimmed;
  }

  if (phone !== undefined) {
    if (!isValidKoreanMobile(phone)) {
      return NextResponse.json({ message: "휴대폰 번호 형식이 올바르지 않습니다." }, { status: 400 });
    }
    updates.phone = phone;
  }

  if (childBirthYear !== undefined) {
    const currentYear = new Date().getFullYear();
    if (childBirthYear < 1990 || childBirthYear > currentYear) {
      return NextResponse.json({ message: "출생 연도가 올바르지 않습니다." }, { status: 400 });
    }
    updates.childBirthYear = childBirthYear;
    /* 다자녀 필드와 첫째 연도를 동일하게 맞춘다(마이페이지는 단일 연도만 수정) */
    updates.childBirthYears = [childBirthYear];
    updates.childCount = 1;
  }

  updateUser(email, updates);
  return NextResponse.json({ message: "정보가 수정되었습니다." });
}
