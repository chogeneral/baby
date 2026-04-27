/**
 * 커뮤니티 게시글 API (Supabase `posts` 테이블).
 * 글 ID는 insert 시 DB가 부여한다. 목록은 이메일/게시판 필터용 함수로만 조회한다.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  appendPost,
  describeAppendPostFailure,
  getPostsByAuthorEmail,
  getPostsByBoardKind,
  type PostRecord,
} from "@/lib/postStore";
import { type CommunityRoomKind } from "@/lib/communityRoom";
import { findByEmail, getPrimaryChildBirthYear } from "@/lib/userStore";
import { getCommunityCommentsByPostId } from "@/lib/communityCommentStore";

function withoutEditPassword(p: PostRecord) {
  const { editPassword: _omit, ...rest } = p;
  return rest;
}

function parseBoardKindQuery(raw: string | null): CommunityRoomKind | null {
  if (!raw) return null;
  if (raw === "kokkoma") return "kokkoma";
  if (raw === "babyStory") return "babyStory";
  if (raw === "youngInfant" || raw === "toddler" || raw === "preschool") {
    return "babyStory";
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authorEmail = searchParams.get("authorEmail");
  const boardKind = parseBoardKindQuery(searchParams.get("boardKind"));

  if (authorEmail) {
    const posts = await getPostsByAuthorEmail(authorEmail);
    return NextResponse.json(posts.map(withoutEditPassword));
  }

  if (boardKind === "babyStory" || boardKind === "kokkoma") {
    const boardPosts = await getPostsByBoardKind(boardKind);
    const postsWithCount = await Promise.all(
      boardPosts.map(async (p) => ({
        ...withoutEditPassword(p),
        commentCount: (await getCommunityCommentsByPostId(p.id)).length,
      })),
    );
    return NextResponse.json(postsWithCount);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title?: string;
    content?: string;
    authorEmail?: string;
    /** 꼬꼬마(익명) 전용 */
    boardKind?: "kokkoma";
    /** 아기이야기 말머리 */
    prefix?: string;
    editPassword?: string;
  };

  const { title, content, authorEmail, boardKind: requestedKind, prefix, editPassword } = body;

  if (!title?.trim() || !content?.trim() || !authorEmail) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const user = await findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const trimmedEditPw =
    typeof editPassword === "string" && editPassword.trim().length > 0
      ? editPassword.trim()
      : undefined;

  if (requestedKind === "kokkoma") {
    const placeholderYear = getPrimaryChildBirthYear(user) ?? new Date().getFullYear();
    const outcome = await appendPost({
      title: title.trim(),
      content: content.trim(),
      authorEmail: user.email,
      authorNickname: "",
      childBirthYear: placeholderYear,
      boardKind: "kokkoma",
      ...(trimmedEditPw ? { editPassword: trimmedEditPw } : {}),
    });
    if (!outcome.ok) {
      return NextResponse.json(
        { message: describeAppendPostFailure(outcome.supabase) },
        { status: 500 },
      );
    }
    revalidatePath("/");
    return NextResponse.json(outcome.post, { status: 201 });
  }

  const primaryYear = getPrimaryChildBirthYear(user);
  if (primaryYear == null) {
    return NextResponse.json(
      { message: "프로필에 자녀 출생 연도를 먼저 등록해 주세요." },
      { status: 400 },
    );
  }

  const outcome = await appendPost({
    title: title.trim(),
    content: content.trim(),
    authorEmail: user.email,
    authorNickname: user.nickname ?? "",
    childBirthYear: primaryYear,
    boardKind: "babyStory",
    ...(prefix ? { prefix } : {}),
    ...(trimmedEditPw ? { editPassword: trimmedEditPw } : {}),
  });
  if (!outcome.ok) {
    return NextResponse.json(
      { message: describeAppendPostFailure(outcome.supabase) },
      { status: 500 },
    );
  }
  revalidatePath("/");
  return NextResponse.json(outcome.post, { status: 201 });
}
