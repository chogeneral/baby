"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
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
    /* eslint-disable react-hooks/set-state-in-effect -- 로그인 세션 이메일로 작성자 식별 */
    setAuthorEmail(session.email);
    /* eslint-enable react-hooks/set-state-in-effect */
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
        const data = (await res.json()) as { message?: string };
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
    <main className={nestForm.nestPage}>
      <p className={nestForm.nestTag}>콘텐츠 글쓰기</p>
      <h1 className={nestForm.nestTitle}>{info.title}</h1>
      <p className={nestForm.nestLead} style={{ marginBottom: "1.25rem" }}>
        이 주제에 맞는 경험이나 정보를 남겨 주세요. 등록 후 목록으로 돌아갑니다.
      </p>

      <form onSubmit={handleSubmit} className={nestForm.nestForm}>
        <div>
          <label htmlFor="contentTopicTitle" className={nestForm.nestLabel}>
            제목
          </label>
          <input
            id="contentTopicTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className={nestForm.nestInput}
          />
        </div>

        <div>
          <label htmlFor="contentTopicBody" className={nestForm.nestLabel}>
            내용
          </label>
          <textarea
            id="contentTopicBody"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해 주세요"
            className={nestForm.nestTextarea}
          />
        </div>

        {error ? <p className={nestForm.nestError}>{error}</p> : null}

        <div className={nestForm.nestActions}>
          <Link
            href={info.backPath}
            className={`${nestForm.nestBtnSecondary} ${nestForm.flex1}`}
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${nestForm.nestBtnPrimary} ${nestForm.flex1}`}
          >
            {isSubmitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>
    </main>
  );
}
