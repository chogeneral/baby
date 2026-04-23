import { NextRequest, NextResponse } from "next/server";
import {
  getPostById,
  incrementViewCount,
  updateContentTopicPost,
} from "@/lib/contentTopicPostStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) {
    return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  incrementViewCount(id);
  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as {
    password?: string;
    title?: string;
    content?: string;
    authorEmail?: string;
  };

  const { password, title, content, authorEmail } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const result = updateContentTopicPost(
    id,
    { title, content },
    { password, authorEmail },
  );

  if (result === "not_found") {
    return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (result === "wrong_password") {
    return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 403 });
  }
  if (result === "forbidden") {
    return NextResponse.json({ message: "수정 권한이 없습니다." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
