"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { communityBoardTitle } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  getCommunityRoomFromBirthYears,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  /** 글쓰기 화면에만 보이는 표시용 닉네임 — 등록 후 목록·상세에도 동일하게 노출된다 */
  const [writerNickname, setWriterNickname] = useState("");
  const [roomKind, setRoomKind] = useState<CommunityRoomKind | null>(null);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setAuthorEmail(session.email);
    setWriterNickname(
      session.nickname?.trim() || session.email.split("@")[0] || "회원",
    );
    setRoomKind(getCommunityRoomFromBirthYears(session.childBirthYears));
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
        body: JSON.stringify({ title, content, authorEmail }),
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

  const roomLabel = roomKind ? communityRoomLabels[roomKind] : null;

  if (!roomKind) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">글쓰기</h1>
        <p className="text-sm text-gray-600 mb-4">
          아이 대표 출생 연도가 없으면 영아방·토들러방·유아방 중 어디에 글을 올릴지 정할 수
          없어요.
        </p>
        <Link
          href="/mypage"
          className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          마이페이지에서 연도 설정
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-xs font-semibold text-indigo-600 mb-1">연령별 게시판</p>
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
        {communityBoardTitle}
      </h1>
      <p className="text-sm font-semibold text-indigo-800 mt-2">
        지금 글이 올라가는 방: {roomLabel?.roomName}{" "}
        <span className="text-xs font-normal text-gray-500">({roomLabel?.ageHint})</span>
      </p>
      <p className="text-sm text-gray-500 mt-1 mb-6">글 등록 · 작성 중인 닉네임 안내</p>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3 mb-6">
        <p className="text-sm text-indigo-950">
          지금 로그인 중인 닉네임은{" "}
          <strong className="text-indigo-700">{writerNickname}</strong> 님이에요.
        </p>
        <p className="text-xs text-indigo-800/85 mt-2 leading-relaxed">
          게시글과 댓글에는 위 닉네임이 <strong>다른 사용자에게도 그대로</strong> 보여요. 방
          구분은 마이페이지의 <strong>대표 출생 연도</strong>를 기준으로 해요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="postTitle" className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          <input
            id="postTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 mb-1">
            내용
          </label>
          <textarea
            id="postContent"
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
            href={roomKind ? communityRoomPath[roomKind] : "/community"}
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
