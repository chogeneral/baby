import { NextRequest, NextResponse } from "next/server";
import { getPostById } from "@/lib/contentTopicPostStore";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) {
    return NextResponse.json({ message: "글을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await req.json() as { password?: string };
  if (!body.password || post.password !== body.password) {
    return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
