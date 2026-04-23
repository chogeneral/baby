import { NextRequest, NextResponse } from "next/server";
import { effectiveBoardKind } from "@/lib/communityRoom";
import {
  getPostById,
  incrementViewCount,
  updateCommunityPost,
} from "@/lib/postStore";
import { findByEmail } from "@/lib/userStore";
import { isKokkomaBoard } from "@/lib/communityRoom";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPostById(id);

  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  /* 수정 화면 등에서 불러올 때는 조회수를 올리지 않는다 */
  const skipView = new URL(req.url).searchParams.get("skipView") === "1";
  if (!skipView) {
    incrementViewCount(id);
    return NextResponse.json({ ...post, viewCount: (post.viewCount ?? 0) + 1 });
  }
  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json() as {
    title?: string;
    content?: string;
    authorEmail?: string;
    prefix?: string;
    editPassword?: string;
  };

  const { title, content, authorEmail, prefix, editPassword } = body;

  if (!title?.trim() || !content?.trim() || !authorEmail) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  if (!findByEmail(authorEmail)) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const existing = getPostById(id);
  if (!existing) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const result = updateCommunityPost(
    id,
    authorEmail,
    {
      title,
      content,
      ...(isKokkomaBoard(effectiveBoardKind(existing)) ? {} : { prefix }),
    },
    { editPassword },
  );

  if (result === "not_found") {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (result === "forbidden") {
    return NextResponse.json({ message: "수정 권한이 없습니다." }, { status: 403 });
  }
  if (result === "wrong_password") {
    return NextResponse.json({ message: "수정 비밀번호가 일치하지 않습니다." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
