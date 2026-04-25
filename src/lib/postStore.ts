import { supabase } from "./supabaseClient";
import {
  type CommunityRoomKind,
  type StoredCommunityBoardKind,
  effectiveBoardKind,
} from "@/lib/communityRoom";

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
};

// boardKind → Supabase posts.category 컬럼값 매핑
const BOARD_KIND_TO_CATEGORY: Record<string, string> = {
  babyStory: "아기이야기",
  youngInfant: "아기이야기",
  toddler: "아기이야기",
  preschool: "아기이야기",
  kokkoma: "꼬꼬마",
};

// Supabase posts.category → boardKind 매핑
const CATEGORY_TO_BOARD_KIND: Record<string, StoredCommunityBoardKind> = {
  "아기이야기": "babyStory",
  "꼬꼬마": "kokkoma",
};

const COMMUNITY_CATEGORIES = ["아기이야기", "꼬꼬마"];

function rowToPost(row: Record<string, unknown>): PostRecord {
  return {
    id: String(row.id),
    title: row.title as string,
    content: row.content as string,
    authorEmail: (row.author_email as string) ?? "",
    authorNickname: (row.nickname as string) ?? "",
    childBirthYear: (row.child_birth_year as number) ?? 0,
    createdAt: row.created_at as string,
    boardKind: CATEGORY_TO_BOARD_KIND[row.category as string] ?? undefined,
    prefix: (row.prefix as string) ?? undefined,
    viewCount: (row.view_count as number) ?? undefined,
    editPassword: (row.edit_password as string) ?? undefined,
  };
}

export async function getPostsByAuthorEmail(authorEmail: string): Promise<PostRecord[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_email", authorEmail)
    .in("category", COMMUNITY_CATEGORIES)
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
}): Promise<PostRecord | null> {
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
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToPost(data as Record<string, unknown>);
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
  if (kind !== "kokkoma" && fields.prefix !== undefined) {
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
    .in("category", COMMUNITY_CATEGORIES)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToPost);
}
