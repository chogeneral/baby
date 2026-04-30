import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrimaryChildBirthYear, lookupUserForLogin } from "@/lib/userStore";

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string; password?: string };
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ message: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const lookup = await lookupUserForLogin(email);
  /** DB 접근 실패 시 401 이 아니라 503 으로 내려서, 크롬 Network 탭과 폼 메시지로 원인 분리 가능하게 한다 */
  if (lookup.status === "db_error") {
    const devHint =
      process.env.NODE_ENV === "development"
        ? `${lookup.message} — NEXT_PUBLIC_SUPABASE_*·RLS 마이그레이션(supabase/migrations)·테이블 app_users 존재 여부를 확인하세요.`
        : "";
    console.error("[login] Supabase 조회 실패:", lookup.message, email);
    return NextResponse.json(
      {
        message:
          devHint.trim().length > 0
            ? `로그인 서버(DB) 오류입니다. ${devHint}`
            : "일시적으로 로그인할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 503 },
    );
  }
  if (lookup.status === "not_found") {
    console.warn("[login] 등록된 이메일 없음:", email);
    return NextResponse.json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const user = lookup.user;

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    console.warn("[login] 비밀번호 불일치:", email);
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
