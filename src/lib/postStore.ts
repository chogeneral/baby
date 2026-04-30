import { supabase } from "./supabase";
import {
  type CommunityRoomKind,
  type StoredCommunityBoardKind,
  effectiveBoardKind,
} from "@/lib/communityRoom";
import { haversineDistanceM } from "@/lib/haversineDistanceM";
import { regionBoardRadiusM } from "@/lib/regionBoardConstants";

export type PostRecord = {
  id: string;
  title: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  childBirthYear: number;
  createdAt: string;
  boardKind?: StoredCommunityBoardKind;
  prefix?: string;
  viewCount?: number;
  editPassword?: string;
  /** `boardKind === regionNearby` 일 때만 — 작성 시점 위경도(목록 필터·표시용) */
  latitude?: number;
  longitude?: number;
};

/** 아기이야기·꼬꼬마·SQL 카테고리명과 동기화(지역1km 는 지역 전용) */
const REGION_POST_CATEGORY = "지역1km" as const;

// boardKind → Supabase posts.category 컬럼값 매핑
const BOARD_KIND_TO_CATEGORY: Record<string, string> = {
  babyStory: "아기이야기",
  youngInfant: "아기이야기",
  toddler: "아기이야기",
  preschool: "아기이야기",
  kokkoma: "꼬꼬마",
  regionNearby: REGION_POST_CATEGORY,
};

// Supabase posts.category → boardKind 매핑
const CATEGORY_TO_BOARD_KIND: Record<string, StoredCommunityBoardKind> = {
  "아기이야기": "babyStory",
  "꼬꼬마": "kokkoma",
  [REGION_POST_CATEGORY]: "regionNearby",
};

/** 마이페이지·사이트맵 등 `posts` 커뮤니티 전체(아기이야기·꼬꼬마·지역1km) */
const ALL_COMMUNITY_POST_CATEGORIES = ["아기이야기", "꼬꼬마", REGION_POST_CATEGORY] as const;

function rowToPost(row: Record<string, unknown>): PostRecord {
  const lat = row.latitude;
  const lng = row.longitude;
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    content: String(row.content ?? ""),
    authorEmail: (row.author_email as string) ?? "",
    authorNickname: (row.nickname as string) ?? "",
    childBirthYear: (row.child_birth_year as number) ?? 0,
    createdAt: String(row.created_at ?? ""),
    boardKind: CATEGORY_TO_BOARD_KIND[row.category as string] ?? undefined,
    prefix: (row.prefix as string) ?? undefined,
    viewCount: (row.view_count as number) ?? undefined,
    editPassword: (row.edit_password as string) ?? undefined,
    ...(typeof lat === "number" && Number.isFinite(lat) ? { latitude: lat } : {}),
    ...(typeof lng === "number" && Number.isFinite(lng) ? { longitude: lng } : {}),
  };
}

export async function getPostsByAuthorEmail(authorEmail: string): Promise<PostRecord[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_email", authorEmail)
    .in("category", [...ALL_COMMUNITY_POST_CATEGORIES])
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToPost);
}

export async function getPostsByBoardKind(kind: CommunityRoomKind): Promise<PostRecord[]> {
  const category = BOARD_KIND_TO_CATEGORY[kind];
  if (!category) return [];
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToPost);
}

export async function getPostById(id: string): Promise<PostRecord | undefined> {
  const numId = Number(id);
  if (isNaN(numId)) return undefined;
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", numId)
    .single();
  if (error || !data) return undefined;
  return rowToPost(data as Record<string, unknown>);
}

/**
 * SEO·Open Graph / 사이트맵용: 커뮤니티(아기이야기·꼬꼬마) 글만 가져온다.
 * 다른 `category` 의 글 id 로는 undefined — 상세 URL 과 일치를 맞춘다.
 */
export async function getCommunityPostByIdForSeo(
  id: string,
): Promise<PostRecord | undefined> {
  const numId = Number(id);
  if (isNaN(numId)) return undefined;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", numId)
      .in("category", [...ALL_COMMUNITY_POST_CATEGORIES])
      .maybeSingle();
    if (error || !data) return undefined;
    return rowToPost(data as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

/** sitemap: 커뮤니티 글 id·갱신 시각(= created_at) */
export async function listCommunityPostIdsForSitemap(): Promise<
  { id: number; createdAt: string | null }[]
> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, created_at")
    .in("category", [...ALL_COMMUNITY_POST_CATEGORIES])
    .order("id", { ascending: true });
  if (error || !data) return [];
  return (data as { id: number; created_at: string | null }[]).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
  }));
}

/**
 * `appendPost` 가 Supabase insert 에서 실패했을 때 API 응답용 짧은 한글 안내.
 * — 외부에 내부 경로·원시 SQL 을 노출하지 않고, 흔한 원인(컬럼 미적용·RLS)만 구체화한다.
 */
export function describeAppendPostFailure(err: { message: string; code?: string }): string {
  const m = err.message.toLowerCase();
  const code = err.code ?? "";

  if (
    code === "42703" ||
    m.includes("latitude") ||
    m.includes("longitude") ||
    (m.includes("column") && (m.includes("does not exist") || m.includes("unknown")))
  ) {
    return (
      "데이터베이스에 지역 글용 위치(위도·경도) 컬럼이 없거나 스키마가 맞지 않습니다. " +
      "Supabase에서 `20260427120000_posts_latitude_longitude.sql` 마이그레이션을 적용했는지 확인해 주세요."
    );
  }
  if (
    m.includes("permission denied") ||
    m.includes("row-level security") ||
    m.includes("new row violates row-level security") ||
    m.includes("rls")
  ) {
    return "게시물 저장이 정책(보안)에 의해 거절되었습니다. Supabase RLS 설정을 확인해 주세요.";
  }
  if (m.includes("check constraint") || m.includes("violates check constraint")) {
    return "저장된 카테고리·형식이 데이터베이스 제약과 맞지 않습니다. 관리자에게 문의해 주세요.";
  }
  return "글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export type AppendPostOutcome =
  | { ok: true; post: PostRecord }
  | { ok: false; supabase: { message: string; code?: string } };

export async function incrementViewCount(id: string): Promise<void> {
  const numId = Number(id);
  if (isNaN(numId)) return;
  const { data } = await supabase
    .from("posts")
    .select("view_count")
    .eq("id", numId)
    .single();
  const current = (data as { view_count: number | null } | null)?.view_count ?? 0;
  await supabase.from("posts").update({ view_count: current + 1 }).eq("id", numId);
}

export async function appendPost(post: {
  title: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  childBirthYear: number;
  boardKind?: StoredCommunityBoardKind;
  prefix?: string;
  editPassword?: string;
  /** `regionNearby` 전용 — 작성 직전 지도(클라이언트)가 보낸 위경도 */
  latitude?: number;
  longitude?: number;
}): Promise<AppendPostOutcome> {
  const category = post.boardKind ? (BOARD_KIND_TO_CATEGORY[post.boardKind] ?? null) : null;
  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: post.title,
      content: post.content,
      author_email: post.authorEmail,
      nickname: post.authorNickname || null,
      child_birth_year: post.childBirthYear,
      category,
      prefix: post.prefix ?? null,
      edit_password: post.editPassword ?? null,
      view_count: 0,
      ...(post.boardKind === "regionNearby" &&
      typeof post.latitude === "number" &&
      Number.isFinite(post.latitude) &&
      typeof post.longitude === "number" &&
      Number.isFinite(post.longitude)
        ? { latitude: post.latitude, longitude: post.longitude }
        : {}),
    })
    .select()
    .single();
  if (error) {
    // 서버 로그 — 클라이언트에는 `describeAppendPostFailure` 만 넘기는 것을 권장
    console.error("[appendPost] Supabase insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
  if (error || !data) {
    return {
      ok: false,
      supabase: { message: error?.message ?? "insert returned no data", code: error?.code },
    };
  }
  return { ok: true, post: rowToPost(data as Record<string, unknown>) };
}

export async function updateCommunityPost(
  id: string,
  editorEmail: string,
  fields: { title: string; content: string; prefix?: string },
  opts?: { editPassword?: string },
): Promise<"ok" | "not_found" | "forbidden" | "wrong_password"> {
  const post = await getPostById(id);
  if (!post) return "not_found";
  if (post.authorEmail !== editorEmail) return "forbidden";

  const storedPw = post.editPassword;
  if (storedPw != null && storedPw.length > 0) {
    if (!opts?.editPassword || opts.editPassword !== storedPw) {
      return "wrong_password";
    }
  }

  const kind = effectiveBoardKind(post);
  const updates: Record<string, unknown> = {
    title: fields.title.trim(),
    content: fields.content.trim(),
  };
  if (
    (kind === "babyStory" || kind === "regionNearby") &&
    fields.prefix !== undefined
  ) {
    updates.prefix = fields.prefix;
  }

  const { error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", Number(id));

  if (error) return "not_found";
  return "ok";
}

export async function deleteCommunityPost(
  id: string,
  authorEmail: string,
): Promise<"ok" | "not_found" | "forbidden"> {
  const post = await getPostById(id);
  if (!post) return "not_found";
  if (post.authorEmail !== authorEmail) return "forbidden";

  const { error } = await supabase.from("posts").delete().eq("id", Number(id));
  if (error) return "not_found";
  return "ok";
}

/**
 * (구 `posts.json` 시절 API 호환) 당시 클라이언트/라우트가 글 id를 `generatePostId` 로 만들었다.
 * Supabase 이후로는 `appendPost` 가 DB `id` 를 돌려주므로 **새 코드에서는 사용하지 말고**,
 * Git에 남은 옛 `api/posts/route.ts` 가 이 이름을 import 하면 모듈을 찾지 못해 빌드가 막히기 때문에
 * **심볼만 유지**해 번들이 통과하도록 한다(로컬 임시 키가 필요할 때만 쓴다).
 */
export function generatePostId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * (구 API 호환) 파일에서 전부 읽어오던 `getAllPosts` — 아기이야기·꼬꼬마(`COMMUNITY_CATEGORIES`) 전체.
 * JSON 시절에는 동기였으나, DB 조회이므로 **반드시 `await`**. 호출부가 `await` 없이 쓰면 런타임만 틀어지니 그때 `await` 를 붙이면 된다.
 */
export async function getAllPosts(): Promise<PostRecord[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .in("category", [...ALL_COMMUNITY_POST_CATEGORIES])
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToPost);
}

/**
 * `지역1km` 글만 가져온 뒤, (centerLat, centerLng) 기준 반경 `radiusM` 안만 남긴다(거리 오름차순 옵션).
 * — Supabase PostGIS 없이 앱에서 Haversine 필터(게시 수가 많아지면 RPC·bbox 인덱스로 전환).
 */
export async function listRegionBoardPostsWithinRadius(
  centerLat: number,
  centerLng: number,
  radiusM: number = regionBoardRadiusM,
): Promise<PostRecord[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("category", REGION_POST_CATEGORY)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = (data as Record<string, unknown>[]).map(rowToPost);
  return rows
    .filter((p) => {
      if (p.latitude == null || p.longitude == null) return false;
      return (
        haversineDistanceM(centerLat, centerLng, p.latitude, p.longitude) <= radiusM
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
