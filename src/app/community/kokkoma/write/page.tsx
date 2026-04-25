"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { BoardRichTextEditor } from "@/components/BoardRichTextEditor";
import { BoardSinglePhotoSection } from "@/components/BoardSinglePhotoSection";
import { readLoginSession } from "@/lib/loginSession";
import { mergeTrailingSinglePhotoHtml, isMergedPostBodyEmpty } from "@/lib/boardSinglePhotoHtml";

/**
 * 꼬꼬마 전용 글쓰기 — 연령 게시판과 달리 대표 출생 연도 없이 작성 가능하고,
 * 서버에는 boardKind: kokkoma 로 저장되어 목록·상세에서 익명으로만 보이게 한다.
 */
export default function KokkomaWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  /** 나중에 수정할 때 모달·API 검증에 쓰는 선택 비밀번호 — 아기이야기와 동일 UX */
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
    if (isMergedPostBodyEmpty(content, attachedPhoto)) {
      setError("내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: mergeTrailingSinglePhotoHtml(content, attachedPhoto),
          authorEmail,
          boardKind: "kokkoma",
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "글 작성에 실패했습니다.");
        return;
      }

      router.push("/community/kokkoma");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authorEmail) return null;

  return (
    <main className={nestForm.nestPage}>
      <h1 className={nestForm.nestTitle}>꼬꼬마(익명게시판)</h1>

      <p className={nestForm.nestLead} style={{ marginBottom: "1.25rem" }}>
        글 등록 안내
      </p>

      <div className={nestForm.nestNotice}>
        <p className={nestForm.nestNoticeSub} style={{ margin: 0 }}>
          이 방에 올린 글과 댓글은 다른 사용자에게 <strong>익명</strong>으로만
          보여요. 자녀 출생 연도를 입력하지 않아도 글을 쓸 수 있어요. 아래 수정
          비밀번호를 넣으면 나중에 글 수정 시 아기이야기와 같이 비밀번호 확인
          단계를 거치게 돼요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={nestForm.nestForm}>
        <div>
          <label htmlFor="kokkomaPostTitle" className={nestForm.nestLabel}>
            제목
          </label>
          <input
            id="kokkomaPostTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className={nestForm.nestInput}
          />
        </div>

        <div>
          <label htmlFor="kokkomaPostContent" className={nestForm.nestLabel}>
            내용
          </label>
          <BoardRichTextEditor
            id="kokkomaPostContent"
            value={content}
            onChange={setContent}
            placeholder="내용을 입력해 주세요"
          />
        </div>

        <BoardSinglePhotoSection
          sectionId="kokkomaWritePhoto"
          value={attachedPhoto}
          onChange={setAttachedPhoto}
        />

        {error ? <p className={nestForm.nestError}>{error}</p> : null}

        <div className={nestForm.nestActions}>
          <Link
            href="/community/kokkoma"
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
