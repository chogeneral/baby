import { NextRequest, NextResponse } from "next/server";
import { getPostById, incrementViewCount, updatePost } from "@/lib/contentTopicPostStore";

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
    photoDataUrl?: string | null;
  };

  const { password, title, content, photoDataUrl } = body;

  if (!password || !title?.trim() || !content?.trim()) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const result = updatePost(id, password, { title, content, photoDataUrl });

  if (result === "not_found") {
    return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (result === "wrong_password") {
    return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
