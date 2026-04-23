import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface ContactBody {
  title: string;
  email: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContactBody>;
    const { title, email, content } = body;

    if (!title?.trim() || !email?.trim() || !content?.trim()) {
      return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"육아박사 문의" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      replyTo: email.trim(),
      subject: `[육아박사 문의] ${title.trim()}`,
      text: `보낸 사람: ${email.trim()}\n\n${content.trim()}`,
      html: `
        <table style="width:100%;max-width:600px;font-family:sans-serif;border-collapse:collapse;">
          <tr>
            <td style="background:#c57b67;padding:24px 32px;">
              <h1 style="margin:0;color:#fff;font-size:1.25rem;">육아박사 문의</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;background:#fff;">
              <p style="margin:0 0 8px;font-size:0.8125rem;color:#888;">제목</p>
              <p style="margin:0 0 24px;font-size:1rem;font-weight:600;color:#2d2926;">${title.trim()}</p>

              <p style="margin:0 0 8px;font-size:0.8125rem;color:#888;">보낸 사람</p>
              <p style="margin:0 0 24px;font-size:1rem;color:#2d2926;">
                <a href="mailto:${email.trim()}" style="color:#c57b67;">${email.trim()}</a>
              </p>

              <p style="margin:0 0 8px;font-size:0.8125rem;color:#888;">내용</p>
              <div style="white-space:pre-wrap;font-size:1rem;color:#2d2926;line-height:1.7;border-left:3px solid #c57b67;padding-left:16px;">${content.trim()}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#faf9f6;font-size:0.75rem;color:#aaa;text-align:center;">
              육아박사 — 자동 발송 메일입니다.
            </td>
          </tr>
        </table>
      `,
    });

    return NextResponse.json({ message: "문의가 접수되었습니다." });
  } catch (err) {
    console.error("[contact] 메일 발송 실패:", err);
    return NextResponse.json(
      { message: "메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
