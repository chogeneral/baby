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
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

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
    if (isMergedPostBodyEmpty(content, attachedPhotos)) {
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
          content: mergeTrailingSinglePhotoHtml(content, attachedPhotos),
          authorEmail,
          boardKind: "kokkoma",
          ...(editPassword.trim() ? { editPassword: editPassword.trim() } : {}),
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
        누구에게도 털어놓지 못한 고민이 있나요? 당신만의 비밀 우체통이 되어 드릴게요. 마음속 무거운 짐을 이곳에 잠시 덜어보세요.
      </p>

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
          value={attachedPhotos}
          onChange={setAttachedPhotos}
        />

        <div>
          <label htmlFor="kokkomaWriteEditPassword" className={nestForm.nestLabel}>
            비밀번호
          </label>
          <input
            id="kokkomaWriteEditPassword"
            type="password"
            maxLength={50}
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="비밀번호를 입력해 주세요"
            className={nestForm.nestInput}
          />
        </div>

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
