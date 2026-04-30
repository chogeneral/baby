import { supabase } from "./supabase";
import { normalizeContentTopicInput, type ContentTopicKind } from "@/lib/contentTopic";

const TABLE = "content_topic_posts";

export type ContentTopicPostRecord = {
  id: string;
  topic: ContentTopicKind;
  title: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  createdAt: string;
  viewCount?: number;
  password?: string;
};

function rowToPost(row: Record<string, unknown>): ContentTopicPostRecord {
  const rawTopic = String(row.topic ?? "");
  /* 구 DB에 영문 topic 이 남아 있을 때 목록·상세가 깨지지 않게 정규화한다(마이그레이션 후엔 한글만 온다). */
  const topic =
    normalizeContentTopicInput(rawTopic) ?? (rawTopic as ContentTopicKind);
  return {
    id: String(row.id),
    topic,
    title: String(row.title ?? ""),
    content: String(row.content ?? ""),
    authorEmail: String(row.author_email ?? ""),
    authorNickname: String(row.author_nickname ?? ""),
    createdAt: String(row.created_at ?? ""),
    viewCount: (row.view_count as number) ?? undefined,
    password: (row.password as string) ?? undefined,
  };
}

export async function getPostsByTopic(
  topic: ContentTopicKind,
): Promise<ContentTopicPostRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("topic", topic)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToPost);
}

export async function getPostById(
  id: string,
): Promise<ContentTopicPostRecord | undefined> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return undefined;
    return rowToPost(data as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

export async function incrementViewCount(id: string): Promise<void> {
  const post = await getPostById(id);
  if (!post) return;
  const n = (post.viewCount ?? 0) + 1;
  await supabase.from(TABLE).update({ view_count: n }).eq("id", id);
}

export async function appendPost(post: ContentTopicPostRecord): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    id: post.id,
    topic: post.topic,
    title: post.title,
    content: post.content,
    author_email: post.authorEmail,
    author_nickname: post.authorNickname,
    view_count: post.viewCount ?? 0,
    password: post.password ?? null,
    created_at: post.createdAt,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export type UpdatePostFields = {
  title: string;
  content: string;
};

export async function updateContentTopicPost(
  id: string,
  fields: UpdatePostFields,
  auth: { authorEmail?: string; password?: string },
): Promise<"ok" | "not_found" | "wrong_password" | "forbidden"> {
  const post = await getPostById(id);
  if (!post) return "not_found";

  const isAuthor = !!auth.authorEmail && post.authorEmail === auth.authorEmail;
  const passwordMatches =
    !!post.password && !!auth.password && post.password === auth.password;

  if (!isAuthor && !passwordMatches) {
    if (post.password) return "wrong_password";
    return "forbidden";
  }

  const { error } = await supabase
    .from(TABLE)
    .update({ title: fields.title.trim(), content: fields.content.trim() })
    .eq("id", id);
  if (error) return "not_found";
  return "ok";
}

export async function deleteContentTopicPost(
  id: string,
  auth: { authorEmail?: string; password?: string },
): Promise<"ok" | "not_found" | "forbidden" | "wrong_password"> {
  const post = await getPostById(id);
  if (!post) return "not_found";

  const isAuthor = !!auth.authorEmail && post.authorEmail === auth.authorEmail;
  const passwordMatches = !!post.password && !!auth.password && post.password === auth.password;

  if (!isAuthor && !passwordMatches) {
    if (post.password) return "wrong_password";
    return "forbidden";
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return "not_found";
  return "ok";
}

export function generateContentTopicPostId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * sitemap: 부모이야기·정보 전체 row(id, topic, 시각) — `normalizeContentTopicInput` 이 null 이면 제외(깨진 topic)
 */
export async function listContentTopicPostEntriesForSitemap(): Promise<
  { id: string; topic: ContentTopicKind; createdAt: string | null }[]
> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, topic, created_at")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  const out: { id: string; topic: ContentTopicKind; createdAt: string | null }[] = [];
  for (const row of data as Record<string, unknown>[]) {
    const n = normalizeContentTopicInput(String(row.topic ?? ""));
    if (!n) continue;
    out.push({
      id: String(row.id),
      topic: n,
      createdAt: (row.created_at as string) ?? null,
    });
  }
  return out;
}
