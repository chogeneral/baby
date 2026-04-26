import { supabase } from "./supabase";

export type CommunityCommentRecord = {
  id: string;
  postId: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  createdAt: string;
  parentId?: string;
};

function rowToComment(row: Record<string, unknown>): CommunityCommentRecord {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    content: row.content as string,
    authorEmail: (row.author_email as string) ?? "",
    authorNickname: (row.author_nickname as string) ?? "",
    createdAt: row.created_at as string,
    parentId: row.parent_id != null ? String(row.parent_id) : undefined,
  };
}

export async function getCommunityCommentsByPostId(postId: string): Promise<CommunityCommentRecord[]> {
  const numId = Number(postId);
  if (isNaN(numId)) return [];
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", numId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToComment);
}

export async function appendCommunityComment(comment: {
  postId: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  parentId?: string;
}): Promise<CommunityCommentRecord | null> {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: Number(comment.postId),
      content: comment.content,
      author_email: comment.authorEmail,
      author_nickname: comment.authorNickname,
      parent_id: comment.parentId != null ? Number(comment.parentId) : null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToComment(data as Record<string, unknown>);
}
