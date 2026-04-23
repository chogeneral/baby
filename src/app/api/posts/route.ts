import { NextRequest, NextResponse } from "next/server";
import {
  appendPost,
  generatePostId,
  getAllPosts,
  getPostsByBoardKind,
  type PostRecord,
} from "@/lib/postStore";
import {
  type CommunityRoomKind,
  inferBoardKindFromBirthYear,
} from "@/lib/communityRoom";
import { findByEmail, getPrimaryChildBirthYear } from "@/lib/userStore";
import { getCommentsByPostId } from "@/lib/commentStore";

/** 목록·마이페이지 등에서는 수정 비밀번호를 내려주지 않는다 */
function withoutEditPassword(p: PostRecord) {
  const { editPassword: _omit, ...rest } = p;
  return rest;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authorEmail = searchParams.get("authorEmail");
  const boardKind = searchParams.get("boardKind") as CommunityRoomKind | null;

  const posts = getAllPosts();

  if (authorEmail) {
    const filtered = posts.filter((p) => p.authorEmail === authorEmail);
    return NextResponse.json(filtered.map(withoutEditPassword));
  }

  if (
    boardKind === "youngInfant" ||
    boardKind === "toddler" ||
    boardKind === "preschool" ||
    boardKind === "kokkoma"
  ) {
    const boardPosts = getPostsByBoardKind(boardKind);
    return NextResponse.json(
      boardPosts.map((p) => ({
        ...withoutEditPassword(p),
        commentCount: getCommentsByPostId(p.id).length,
      })),
    );
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title?: string;
    content?: string;
    authorEmail?: string;
    /** 꼬꼬마(익명) 전용 — 클라이언트가 보내면 연령 게시판 분기 대신 이쪽으로만 저장한다 */
    boardKind?: "kokkoma";
    /** 영아방 말머리 */
    prefix?: string;
    /** 연령방 — 수정 시에도 필요한 비밀번호(선택, 발달·부모이야기와 동일 UX) */
    editPassword?: string;
  };

  const { title, content, authorEmail, boardKind: requestedKind, prefix, editPassword } = body;

  if (!title?.trim() || !content?.trim() || !authorEmail) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const user = findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  /* 꼬꼬마(익명): 자녀 출생 연도 없이도 작성 가능 — 저장용 연도만 플레이스홀더로 둔다 */
  if (requestedKind === "kokkoma") {
    const placeholderYear = getPrimaryChildBirthYear(user) ?? new Date().getFullYear();
    const post: PostRecord = {
      id: generatePostId(),
      title: title.trim(),
      content: content.trim(),
      authorEmail: user.email,
      authorNickname: "",
      childBirthYear: placeholderYear,
      boardKind: "kokkoma",
      createdAt: new Date().toISOString(),
    };
    appendPost(post);
    return NextResponse.json(post, { status: 201 });
  }

  const primaryYear = getPrimaryChildBirthYear(user);
  if (primaryYear == null) {
    return NextResponse.json(
      { message: "프로필에 자녀 출생 연도를 먼저 등록해 주세요." },
      { status: 400 },
    );
  }

  const boardKind = inferBoardKindFromBirthYear(primaryYear);

  const trimmedEditPw =
    typeof editPassword === "string" && editPassword.trim().length > 0
      ? editPassword.trim()
      : undefined;

  const post: PostRecord = {
    id: generatePostId(),
    title: title.trim(),
    content: content.trim(),
    authorEmail: user.email,
    authorNickname: user.nickname ?? "",
    childBirthYear: primaryYear,
    boardKind,
    createdAt: new Date().toISOString(),
    ...(prefix ? { prefix } : {}),
    ...(trimmedEditPw ? { editPassword: trimmedEditPw } : {}),
  };

  appendPost(post);
  return NextResponse.json(post, { status: 201 });
}
