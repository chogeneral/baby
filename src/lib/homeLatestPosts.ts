import { isSupabaseConfigured, supabase } from "./supabase";
import type { ContentTopicKind } from "@/lib/contentTopic";

export type HomeLatestPostPreview = {
  id: string;
  title: string;
  dateLabel: string;
  authorLabel?: string;
};

const previewLimit = 5;

/**
 * `created_at` 을 YYYY-MM-DD 로만 쓰기 위한 정규화.
 * PostgREST 는 보통 ISO 문자열을 주지만, null·예외 형태에 대해 홈 전체가 깨지지 않게 막는다.
 */
function dateLabelFromCreatedAt(createdAt: unknown): string {
  if (createdAt == null) return "";
  if (typeof createdAt === "string") {
    return createdAt.length >= 10 ? createdAt.slice(0, 10) : createdAt;
  }
  if (createdAt instanceof Date) {
    return createdAt.toISOString().slice(0, 10);
  }
  return String(createdAt).slice(0, 10);
}

/** 슈파베이스 `posts` — category 가 아기이야기·꼬꼬마 인 커뮤니티 글 */
async function fetchLatestByCategory(category: string): Promise<HomeLatestPostPreview[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, created_at, nickname")
    .eq("category", category)
    .order("created_at", { ascending: false })
    .limit(previewLimit);

  if (error) {
    console.error(`[homeLatestPosts] "${category}" 로드 실패:`, error.message, error);
    return [];
  }

  if (!data) return [];

  return data.map((p) => ({
    id: String(p.id),
    title: typeof p.title === "string" && p.title.trim() !== "" ? p.title : "제목 없음",
    dateLabel: dateLabelFromCreatedAt(p.created_at),
    authorLabel: (typeof p.nickname === "string" && p.nickname.trim() !== "" ? p.nickname : null) || "—",
  }));
}

/** 부모이야기·정보 — public.content_topic_posts (topic 키로 구분, posts.category 와 별도) */
async function fetchLatestContentTopic(topic: ContentTopicKind): Promise<HomeLatestPostPreview[]> {
  const { data, error } = await supabase
    .from("content_topic_posts")
    .select("id, title, created_at, author_nickname")
    .eq("topic", topic)
    .order("created_at", { ascending: false })
    .limit(previewLimit);

  if (error) {
    console.error(`[homeLatestPosts] content_topic topic=${topic}:`, error.message, error);
    return [];
  }
  if (!data) return [];

  return data.map((p) => ({
    id: String(p.id),
    title: typeof p.title === "string" && p.title.trim() !== "" ? p.title : "제목 없음",
    dateLabel: dateLabelFromCreatedAt(p.created_at),
    authorLabel:
      (typeof p.author_nickname === "string" && p.author_nickname.trim() !== ""
        ? p.author_nickname
        : null) || "—",
  }));
}

/** 메인 페이지에서 호출하는 함수 */
export async function getHomeLatestPostPreviews() {
  /* Vercel 에서 env 누락 시에도 prerender 가 실패하지 않게, DB 호출 전에 막는다. */
  if (!isSupabaseConfigured()) {
    console.warn(
      "[homeLatestPosts] Supabase env 없음 — 최신 글 없이 홈을 렌더합니다. " +
        "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 를 Vercel 에 설정하세요.",
    );
    return { babyStory: [], parentStories: [], kokkoma: [], info: [] };
  }

  const [babyStory, parentStories, kokkoma, info] = await Promise.all([
    fetchLatestByCategory("아기이야기"),
    fetchLatestContentTopic("부모이야기"),
    fetchLatestByCategory("꼬꼬마"),
    fetchLatestContentTopic("정보"),
  ]);

  return {
    babyStory,
    parentStories,
    kokkoma,
    info,
  };
}
