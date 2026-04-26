import { NextRequest, NextResponse } from "next/server";
import { verifyFindIdToken } from "@/lib/findIdToken";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const email = verifyFindIdToken(token);

  if (!email) {
    return NextResponse.redirect(new URL("/find-id?error=expired", req.url));
  }

  return NextResponse.redirect(
    new URL(`/login?email=${encodeURIComponent(email)}`, req.url),
  );
}
