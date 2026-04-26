import { NextRequest, NextResponse } from "next/server";
import { verifyResetToken } from "@/lib/resetPasswordToken";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const email = verifyResetToken(token);

  if (!email) {
    return NextResponse.redirect(new URL("/find-password?error=expired", req.url));
  }

  return NextResponse.redirect(
    new URL(`/find-password/reset?token=${encodeURIComponent(token)}`, req.url),
  );
}
