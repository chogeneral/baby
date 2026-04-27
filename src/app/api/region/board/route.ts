import { NextRequest, NextResponse } from "next/server";
import { findBannedWord } from "@/lib/contentFilter";
import { haversineDistanceM } from "@/lib/haversineDistanceM";
import { htmlToPlainText } from "@/lib/postHtmlUtils";
import {
  appendPost,
  describeAppendPostFailure,
  listRegionBoardPostsWithinRadius,
  type PostRecord,
} from "@/lib/postStore";
import { regionBoardRadiusM } from "@/lib/regionBoardConstants";
import { getCommunityCommentsByPostId } from "@/lib/communityCommentStore";
import { findByEmail, getPrimaryChildBirthYear } from "@/lib/userStore";
import { isValidRegionPostType } from "@/lib/regionPostTypes";

function withoutEditPassword(p: PostRecord) {
  const { editPassword: _e, ...rest } = p;
  return rest;
}

/**
 * GET ?lat=&lng=&radiusM= — 현재 위치 기준 1km(기본) 안에 있는 지역1km 글 + 댓글 수·거리(m).
 * POST — 로그인 사용자가 작성 시점 좌표를 보내며 글을 남긴다(이후 목록은 독자 위치 기준 필터).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const rawR = searchParams.get("radiusM");
  const r = rawR == null || rawR === "" ? regionBoardRadiusM : parseInt(rawR, 10);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ message: "쿼리에 lat, lng가 필요합니다." }, { status: 400 });
  }

  const radiusM = Number.isFinite(r) && r > 0 && r <= 50_000 ? r : regionBoardRadiusM;
  const posts = await listRegionBoardPostsWithinRadius(lat, lng, radiusM);

  const withMeta = await Promise.all(
    posts.map(async (p) => {
      const commentCount = (await getCommunityCommentsByPostId(p.id)).length;
      const distanceM =
        p.latitude != null && p.longitude != null
          ? Math.round(haversineDistanceM(lat, lng, p.latitude, p.longitude))
          : undefined;
      return { ...withoutEditPassword(p), commentCount, distanceM };
    }),
  );

  return NextResponse.json({ posts: withMeta, radiusM });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title?: string;
    content?: string;
    authorEmail?: string;
    latitude?: number;
    longitude?: number;
    editPassword?: string;
    /** 지역 유형(고민·육아용품거래 …) — 클라이언트가 `prefix` 키로 보낸다 */
    prefix?: string;
  };

  const {
    title,
    content,
    authorEmail,
    latitude,
    longitude,
    editPassword,
    prefix: rawPrefix,
  } = body;

  if (!title?.trim() || !content?.trim() || !authorEmail) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const prefix = typeof rawPrefix === "string" ? rawPrefix.trim() : "";
  if (!prefix || !isValidRegionPostType(prefix)) {
    return NextResponse.json(
      { message: "유형을 올바르게 선택해 주세요." },
      { status: 400 },
    );
  }

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return NextResponse.json(
      { message: "지도에서 잡힌 작성 위치(위도·경도)가 필요합니다." },
      { status: 400 },
    );
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return NextResponse.json({ message: "위도·경도 값이 올바르지 않습니다." }, { status: 400 });
  }

  const user = await findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const primaryYear = getPrimaryChildBirthYear(user);
  if (primaryYear == null) {
    return NextResponse.json(
      { message: "프로필에 자녀 출생 연도를 먼저 등록해 주세요." },
      { status: 400 },
    );
  }

  const plain = htmlToPlainText(content);
  if (findBannedWord(title) || findBannedWord(plain)) {
    return NextResponse.json(
      { message: "제목·내용에 사용할 수 없는 표현이 있습니다." },
      { status: 400 },
    );
  }

  const trimmedEditPw =
    typeof editPassword === "string" && editPassword.trim().length > 0
      ? editPassword.trim()
      : undefined;

  const outcome = await appendPost({
    title: title.trim(),
    content: content.trim(),
    authorEmail: user.email,
    authorNickname: user.nickname ?? "",
    childBirthYear: primaryYear,
    boardKind: "regionNearby",
    prefix,
    latitude,
    longitude,
    ...(trimmedEditPw ? { editPassword: trimmedEditPw } : {}),
  });

  if (!outcome.ok) {
    return NextResponse.json(
      { message: describeAppendPostFailure(outcome.supabase) },
      { status: 500 },
    );
  }

  return NextResponse.json(withoutEditPassword(outcome.post), { status: 201 });
}
