import { supabase } from "./supabaseClient";

const TABLE = "content_topic_comments";

export type CommentRecord = {
  id: string;
  postId: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  createdAt: string;
  parentId?: string;
};

function rowToComment(row: Record<string, unknown>): CommentRecord {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    content: String(row.content ?? ""),
    authorEmail: String(row.author_email ?? ""),
    authorNickname: String(row.author_nickname ?? ""),
    createdAt: row.created_at as string,
    parentId: row.parent_id != null ? String(row.parent_id) : undefined,
  };
}

/** 부모이야기·정보 글(id=문자열)에 달리는 댓글 — public.content_topic_comments */
export async function getCommentsByPostId(
  postId: string,
): Promise<CommentRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToComment);
}

export async function appendComment(comment: CommentRecord): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    id: comment.id,
    post_id: comment.postId,
    content: comment.content,
    author_email: comment.authorEmail,
    author_nickname: comment.authorNickname,
    parent_id: comment.parentId ?? null,
    created_at: comment.createdAt,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export function generateCommentId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
