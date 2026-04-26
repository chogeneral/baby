import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { findByPhone } from "@/lib/userStore";
import { createFindIdToken } from "@/lib/findIdToken";

const PHONE_RE = /^01[016789][0-9]{7,8}$/;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { phone?: string };
  const phone = body.phone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");

  if (!digits || !PHONE_RE.test(digits)) {
    return NextResponse.json(
      { message: "올바른 휴대폰 번호를 입력해 주세요." },
      { status: 400 },
    );
  }

  const user = await findByPhone(digits);
  console.log("[find-id] phone:", digits, "/ user found:", !!user);

  // 미가입 번호여도 동일 응답 (이메일 존재 여부 노출 방지)
  if (!user) {
    return NextResponse.json({ message: "ok" });
  }

  const token = createFindIdToken(user.email);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const link = `${base}/api/auth/find-id/verify?token=${encodeURIComponent(token)}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"육아박사" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "[육아박사] 아이디 확인 링크",
      html: `
        <table style="width:100%;max-width:600px;font-family:sans-serif;border-collapse:collapse;">
          <tr>
            <td style="background:#c57b67;padding:24px 32px;">
              <h1 style="margin:0;color:#fff;font-size:1.25rem;">육아박사 아이디 찾기</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;background:#fff;">
              <p style="margin:0 0 16px;font-size:1rem;color:#2d2926;line-height:1.6;">
                아래 버튼을 클릭하면 로그인 페이지에 아이디(이메일)가 자동으로 입력됩니다.<br/>
                링크는 <strong>15분</strong> 후 만료됩니다.
              </p>
              <a href="${link}"
                 style="display:inline-block;padding:12px 28px;background:#c57b67;color:#fff;border-radius:999px;text-decoration:none;font-weight:700;font-size:1rem;">
                아이디 확인하기
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#faf9f6;font-size:0.75rem;color:#aaa;text-align:center;">
              육아박사 — 자동 발송 메일입니다. 본인이 요청하지 않았다면 무시하세요.
            </td>
          </tr>
        </table>
      `,
    });
  } catch (err) {
    console.error("[find-id] 메일 발송 실패:", err);
    return NextResponse.json(
      { message: "메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "ok" });
}
