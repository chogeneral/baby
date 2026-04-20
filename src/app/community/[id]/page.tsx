"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { communityBoardTitle, displayCommunityNickname } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  inferBoardKindFromBirthYear,
  isKokkomaBoard,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";

type Post = {
  id: string;
  title: string;
  content: string;
  authorNickname: string;
  childBirthYear: number;
  boardKind?: CommunityRoomKind;
  createdAt: string;
};

type Comment = {
  id: string;
  content: string;
  authorNickname: string;
  createdAt: string;
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);

  useEffect(() => {
    const session = readLoginSession();
    setAuthorEmail(session?.email ?? null);

    Promise.all([
      fetch(`/api/posts/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/posts/${id}/comments`).then((r) => r.json()),
    ]).then(([postData, commentsData]) => {
      setPost(postData as Post | null);
      setComments(commentsData as Comment[]);
      setIsLoading(false);
    });
  }, [id]);

  async function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentText.trim() || !authorEmail) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText, authorEmail }),
      });

      if (!res.ok) return;

      const newComment = await res.json() as Comment;
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-center text-gray-400 py-16">불러오는 중…</p>;
  }

  if (!post) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">게시글을 찾을 수 없습니다.</p>
        <Link href="/community" className="text-indigo-600 hover:underline text-sm">
          목록으로 돌아가기
        </Link>
      </main>
    );
  }

  const postRoom =
    post.boardKind ?? inferBoardKindFromBirthYear(post.childBirthYear);
  const postRoomName = communityRoomLabels[postRoom].roomName;
  const anonymousMode = isKokkomaBoard(postRoom);
  const listHref = anonymousMode ? "/community/kokkoma" : communityRoomPath[postRoom];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-xs text-indigo-600 font-medium mb-1">
        {communityBoardTitle} · {postRoomName}
      </p>
      <button
        type="button"
        onClick={() => router.push(listHref)}
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 block"
      >
        ← 목록으로
      </button>

      <article className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <span className="text-gray-500">
            {anonymousMode ? "익명" : displayCommunityNickname(post.authorNickname)}
          </span>
          <span>·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </article>

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          댓글 <span className="text-indigo-600">{comments.length}</span>
        </h2>

        <ul className="divide-y divide-gray-100 mb-6">
          {comments.length === 0 && (
            <li className="py-6 text-center text-sm text-gray-400">첫 번째 댓글을 남겨보세요.</li>
          )}
          {comments.map((comment) => (
            <li key={comment.id} className="py-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span className="font-medium text-gray-500">
                  {anonymousMode ? "익명" : displayCommunityNickname(comment.authorNickname)}
                </span>
                <span>·</span>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </li>
          ))}
        </ul>

        {authorEmail ? (
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                anonymousMode
                  ? "댓글은 익명으로 표시돼요"
                  : "댓글은 마이페이지 닉네임으로 표시돼요"
              }
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="self-end bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "…" : "등록"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            <Link href="/login" className="text-indigo-600 hover:underline">
              로그인
            </Link>
            하면 댓글을 남길 수 있어요.
          </p>
        )}
      </section>
    </main>
  );
}
