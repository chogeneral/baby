"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { contentTopicPageInfo, type ContentTopicKind } from "@/lib/contentTopic";
import { readLoginSession } from "@/lib/loginSession";

type Props = {
  /** 어떤 콘텐츠 메뉴에 속하는 글인지 — API·저장소 필터와 동일한 키 */
  topic: ContentTopicKind;
};

/**
 * 발달 / 육아용품 / 부모이야기 공통 글쓰기 폼.
 * 로그인 세션의 이메일로 서버에 저장하고, 등록 후에는 해당 메뉴 목록 페이지로 돌아간다.
 */
export function ContentTopicWriteForm({ topic }: Props) {
  const router = useRouter();
  const info = contentTopicPageInfo[topic];
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
      const res = await fetch("/api/content-topic-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, authorEmail, topic }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setError(data.message ?? "글 작성에 실패했습니다.");
        return;
      }

      router.push(info.backPath);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authorEmail) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-xs font-semibold text-indigo-600 mb-1">콘텐츠 글쓰기</p>
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
        {info.title}
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        이 주제에 맞는 경험이나 정보를 남겨 주세요. 등록 후 목록으로 돌아갑니다.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="contentTopicTitle" className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          <input
            id="contentTopicTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="contentTopicBody" className="block text-sm font-medium text-gray-700 mb-1">
            내용
          </label>
          <textarea
            id="contentTopicBody"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해 주세요"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Link
            href={info.backPath}
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
