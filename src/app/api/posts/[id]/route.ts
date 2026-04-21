import { NextRequest, NextResponse } from "next/server";
import { getPostById, incrementViewCount } from "@/lib/postStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPostById(id);

  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  incrementViewCount(id);
  return NextResponse.json({ ...post, viewCount: (post.viewCount ?? 0) + 1 });
}
