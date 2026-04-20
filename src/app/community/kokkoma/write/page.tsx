"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { communityBoardTitle } from "@/lib/communityBoard";
import { readLoginSession } from "@/lib/loginSession";

/**
 * 꼬꼬마(익명게시판) 전용 글쓰기 — 연령 게시판과 달리 대표 출생 연도 없이 작성 가능하고,
 * 서버에는 boardKind: kokkoma 로 저장되어 목록·상세에서 익명으로만 보이게 한다.
 */
export default function KokkomaWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setAuthorEmail(session.email);
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    if (!content.trim()) {
      setError("내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, authorEmail, boardKind: "kokkoma" }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setError(data.message ?? "글 작성에 실패했습니다.");
        return;
      }

      const post = await res.json() as { id: string };
      router.push(`/community/${post.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authorEmail) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-xs font-semibold text-indigo-600 mb-1">익명 게시판</p>
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
        꼬꼬마(익명게시판)
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-1">{communityBoardTitle}</p>
      <p className="text-sm text-gray-500 mb-6">글 등록 안내</p>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3 mb-6">
        <p className="text-xs text-indigo-800/85 leading-relaxed">
          이 방에 올린 글과 댓글은 다른 사용자에게 <strong>익명</strong>으로만 보여요. 자녀
          출생 연도를 입력하지 않아도 글을 쓸 수 있어요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="kokkomaPostTitle" className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          <input
            id="kokkomaPostTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="kokkomaPostContent" className="block text-sm font-medium text-gray-700 mb-1">
            내용
          </label>
          <textarea
            id="kokkomaPostContent"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해 주세요"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Link
            href="/community/kokkoma"
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md text-sm text-center hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>
    </main>
  );
}
