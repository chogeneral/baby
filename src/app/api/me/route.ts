import { NextRequest, NextResponse } from "next/server";
import { findByEmail, getPrimaryChildBirthYear, updateUser } from "@/lib/userStore";
import { isValidKoreanMobile } from "@/lib/formatKoreanPhone";
import { validateChildProfilePayload } from "@/lib/validateChildProfilePayload";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ message: "이메일이 필요합니다." }, { status: 400 });
  }

  const user = await findByEmail(email);
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
    childNames: user.childNames,
    childBirthDates: user.childBirthDates,
    primaryChildIndex: user.primaryChildIndex ?? 0,
    createdAt: user.createdAt,
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    email?: string;
    nickname?: string;
    phone?: string;
    /** 기준(대표) 아이 — childBirthYears[primaryChildIndex] 로 연령방이 갈림 */
    primaryChildIndex?: number;
    /** 출산 등으로 늘어난 경우·고친 경우 — childNames·childBirthDates 와 같이 보낸다(가입과 동일 검증) */
    childCount?: number;
    childNames?: string[];
    childBirthDates?: string[];
  };

  const { email, nickname, phone, primaryChildIndex, childCount, childNames, childBirthDates } =
    body;

  if (!email) {
    return NextResponse.json({ message: "이메일이 필요합니다." }, { status: 400 });
  }

  const user = await findByEmail(email);
  if (!user) {
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

  const isChildBundle =
    childCount !== undefined || childNames !== undefined || childBirthDates !== undefined;
  if (isChildBundle) {
    if (childCount === undefined || childNames === undefined || childBirthDates === undefined) {
      return NextResponse.json(
        { message: "자녀 수·이름·생일을 함께 보내 주세요." },
        { status: 400 },
      );
    }
    const today = new Date();
    const maxStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const v = validateChildProfilePayload(childCount, childNames, childBirthDates, maxStr);
    if (!v.ok) {
      return NextResponse.json({ message: v.message }, { status: 400 });
    }
    updates.childCount = v.childCount;
    updates.childNames = v.trimmedNames;
    updates.childBirthDates = v.childBirthDates;
    updates.childBirthYears = v.childBirthYears;
  }

  /* 저장될 childBirthYears 기준으로 기준 아이·대표 연도 — 자녀 묶음이 있으면 그 연도, 없으면 기존 회원 */
  const yearsAfter = updates.childBirthYears ?? user.childBirthYears;
  const n = yearsAfter?.length ?? 0;

  if (primaryChildIndex !== undefined) {
    if (n < 1) {
      return NextResponse.json(
        { message: "자녀 출생 정보가 없어 기준을 바꿀 수 없습니다. 먼저 자녀 수와 정보를 저장해 주세요." },
        { status: 400 },
      );
    }
    if (
      typeof primaryChildIndex !== "number" ||
      !Number.isInteger(primaryChildIndex) ||
      primaryChildIndex < 0 ||
      primaryChildIndex >= n
    ) {
      return NextResponse.json({ message: "아이 선택이 올바르지 않습니다." }, { status: 400 });
    }
    updates.primaryChildIndex = primaryChildIndex;
    if (yearsAfter) {
      updates.childBirthYear = yearsAfter[primaryChildIndex];
    }
  } else if (isChildBundle && n > 0 && yearsAfter) {
    /* 자녀만 바꾸고 셀은 안 보낸 경우: 이전에 고른 아이를 가능한 범위로 유지(줄이면 둘째→첫째로) */
    const prevIdx = user.primaryChildIndex ?? 0;
    const newPrimary = Math.max(0, Math.min(prevIdx, n - 1));
    updates.primaryChildIndex = newPrimary;
    updates.childBirthYear = yearsAfter[newPrimary];
  }

  await updateUser(email, updates);
  return NextResponse.json({ message: "정보가 수정되었습니다." });
}
