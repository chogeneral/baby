import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { findByEmail } from "@/lib/userStore";
import { createResetToken } from "@/lib/resetPasswordToken";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { message: "올바른 이메일을 입력해 주세요." },
      { status: 400 },
    );
  }

  const user = await findByEmail(email);
  console.log("[find-password] email:", email, "/ user found:", !!user);

  // 미가입 이메일도 동일 응답 (이메일 존재 여부 노출 방지)
  if (!user) {
    return NextResponse.json({ message: "ok" });
  }

  const token = createResetToken(email);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const link = `${base}/api/auth/find-password/verify?token=${encodeURIComponent(token)}`;

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
      to: email,
      subject: "[육아박사] 비밀번호 재설정 링크",
      html: `
        <table style="width:100%;max-width:600px;font-family:sans-serif;border-collapse:collapse;">
          <tr>
            <td style="background:#c57b67;padding:24px 32px;">
              <h1 style="margin:0;color:#fff;font-size:1.25rem;">육아박사 비밀번호 재설정</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;background:#fff;">
              <p style="margin:0 0 16px;font-size:1rem;color:#2d2926;line-height:1.6;">
                아래 버튼을 클릭하면 새 비밀번호를 설정할 수 있습니다.<br/>
                링크는 <strong>1시간</strong> 후 만료됩니다.
              </p>
              <a href="${link}"
                 style="display:inline-block;padding:12px 28px;background:#c57b67;color:#fff;border-radius:999px;text-decoration:none;font-weight:700;font-size:1rem;">
                비밀번호 재설정하기
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
    console.error("[find-password] 메일 발송 실패:", err);
    return NextResponse.json(
      { message: "메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "ok" });
}
