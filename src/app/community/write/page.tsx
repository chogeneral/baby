"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import {
  getCommunityRoomFromBirthYears,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { BoardRichTextEditor } from "@/components/BoardRichTextEditor";
import { BoardSinglePhotoSection } from "@/components/BoardSinglePhotoSection";
import { readLoginSession } from "@/lib/loginSession";
import { findBannedWord } from "@/lib/contentFilter";
import {
  mergeTrailingSinglePhotoHtml,
  isMergedPostBodyEmpty,
} from "@/lib/boardSinglePhotoHtml";
import { htmlToPlainText } from "@/lib/postHtmlUtils";

/** 아기이야기 말머리 — 연령 방 분리를 없앤 뒤 단일 목록만 쓴다 */
const babyStoryPrefixes = [
  "언어",
  "놀이",
  "성장",
  "발달",
  "식습관",
  "질문있어요",
] as const;

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  /** 본문 아래 사진(여러 장) — 저장 시 본문 HTML 뒤에 순서대로 붙인다 */
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [prefix, setPrefix] = useState<string>("발달");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [roomKind, setRoomKind] = useState<CommunityRoomKind | null>(null);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect -- 로그인 세션으로 글쓰기 폼의 작성자·방 정보를 맞춘다 */
    setAuthorEmail(session.email);
    const room = getCommunityRoomFromBirthYears(
      session.childBirthYears,
      new Date(),
      session.primaryChildIndex ?? 0,
    );
    setRoomKind(room);
    if (room) setPrefix(babyStoryPrefixes[0]);
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
    const plainBody = htmlToPlainText(
      mergeTrailingSinglePhotoHtml(content, attachedPhotos),
    );

    const bannedInTitle = findBannedWord(title);
    if (bannedInTitle) {
      setError("제목에 사용할 수 없는 표현이 포함되어 있습니다.");
      return;
    }
    const bannedInContent = findBannedWord(plainBody);
    if (bannedInContent) {
      setError("내용에 사용할 수 없는 표현이 포함되어 있습니다.");
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
          prefix,
          ...(editPassword.trim() ? { editPassword: editPassword.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "글 작성에 실패했습니다.");
        return;
      }

      await res.json();
      router.push("/community/baby-story");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authorEmail) return null;

  if (!roomKind) {
    return (
      <main className={nestForm.nestPage}>
        <h1 className={nestForm.nestTitle}>글쓰기</h1>
        <p className={nestForm.nestLead}>
          프로필에 자녀 출생 연도가 없으면 아기이야기에 글을 올 수 없어요.
        </p>
        <Link
          href="/mypage"
          className={nestForm.nestBtnPrimary}
          style={{ marginTop: "1rem" }}
        >
          마이페이지에서 연도 설정
        </Link>
      </main>
    );
  }

  return (
    <main className={nestForm.nestPage}>
      <h1 className={nestForm.nestTitle}>아기이야기</h1>

      <p className={nestForm.nestLead} style={{ marginBottom: "1.25rem" }}>
      우리 아이들의 이야기를 함께 나누고 공유해요
      </p>

     

      <form onSubmit={handleSubmit} className={nestForm.nestForm}>
        <div>
          <label htmlFor="postPrefix" className={nestForm.nestLabel}>
            말머리
          </label>
          <select
            id="postPrefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className={nestForm.nestSelect}
          >
            {babyStoryPrefixes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="postTitle" className={nestForm.nestLabel}>
            제목
          </label>
          <input
            id="postTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className={nestForm.nestInput}
          />
        </div>

        <div>
          <label htmlFor="postContent" className={nestForm.nestLabel}>
            내용
          </label>
          <BoardRichTextEditor
            id="postContent"
            value={content}
            onChange={setContent}
            placeholder="내용을 입력해 주세요"
          />
        </div>

        <BoardSinglePhotoSection
          sectionId="communityWritePhoto"
          value={attachedPhotos}
          onChange={setAttachedPhotos}
        />

        <div>
          <label htmlFor="communityWriteEditPassword" className={nestForm.nestLabel}>
            비밀번호
          </label>
          <input
            id="communityWriteEditPassword"
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
            href="/community/baby-story"
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
