import { NextRequest, NextResponse } from "next/server";
import { getCommentsByPostId, appendComment, generateCommentId } from "@/lib/commentStore";
import { getPostById } from "@/lib/postStore";
import { findByEmail } from "@/lib/userStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const comments = getCommentsByPostId(id);
  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const post = getPostById(id);
  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await req.json() as { content?: string; authorEmail?: string; parentId?: string };
  const { content, authorEmail, parentId } = body;

  if (!content?.trim() || !authorEmail) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const user = findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const comment = {
    id: generateCommentId(),
    postId: id,
    content: content.trim(),
    authorEmail: user.email,
    authorNickname: user.nickname,
    createdAt: new Date().toISOString(),
    ...(parentId ? { parentId } : {}),
  };

  appendComment(comment);
  return NextResponse.json(comment, { status: 201 });
}
