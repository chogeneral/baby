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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authorEmail = searchParams.get("authorEmail");
  const boardKind = searchParams.get("boardKind") as CommunityRoomKind | null;

  const posts = getAllPosts();

  if (authorEmail) {
    const filtered = posts.filter((p) => p.authorEmail === authorEmail);
    return NextResponse.json(filtered);
  }

  if (
    boardKind === "youngInfant" ||
    boardKind === "toddler" ||
    boardKind === "preschool" ||
    boardKind === "kokkoma"
  ) {
    return NextResponse.json(getPostsByBoardKind(boardKind));
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
    /** 사진첩 이미지 (base64 data URL) */
    photoDataUrl?: string;
  };

  const { title, content, authorEmail, boardKind: requestedKind, prefix, photoDataUrl } = body;

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
      ...(photoDataUrl ? { photoDataUrl } : {}),
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
    ...(photoDataUrl ? { photoDataUrl } : {}),
  };

  appendPost(post);
  return NextResponse.json(post, { status: 201 });
}
