import { NextRequest, NextResponse } from "next/server";
import { effectiveBoardKind, isKokkomaBoard } from "@/lib/communityRoom";
import {
  getPostById,
  incrementViewCount,
  updateCommunityPost,
  deleteCommunityPost,
} from "@/lib/postStore";
import { findByEmail } from "@/lib/userStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const skipView = new URL(req.url).searchParams.get("skipView") === "1";
  if (!skipView) {
    await incrementViewCount(id);
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

  const existing = await getPostById(id);
  if (!existing) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const result = await updateCommunityPost(
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json() as { authorEmail?: string };
  const { authorEmail } = body;

  if (!authorEmail) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const result = await deleteCommunityPost(id, authorEmail);
  if (result === "not_found") {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (result === "forbidden") {
    return NextResponse.json({ message: "삭제 권한이 없습니다." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
