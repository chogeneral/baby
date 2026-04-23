"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import {
  communityRoomLabels,
  communityRoomPath,
  getCommunityRoomFromBirthYears,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { BoardRichTextEditor } from "@/components/BoardRichTextEditor";
import { BoardSinglePhotoSection } from "@/components/BoardSinglePhotoSection";
import { readLoginSession } from "@/lib/loginSession";
import { findBannedWord } from "@/lib/contentFilter";
import { mergeTrailingSinglePhotoHtml, isMergedPostBodyEmpty } from "@/lib/boardSinglePhotoHtml";
import { htmlToPlainText } from "@/lib/postHtmlUtils";

const PREFIXES_BY_ROOM: Record<string, readonly string[]> = {
  youngInfant: ["언어", "놀이", "성장", "식습관"],
  toddler:     ["언어", "놀이", "성장", "식습관"],
  preschool:   ["언어", "놀이", "성장", "식습관"],
};

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  /** 본문 아래 1장 — 저장 시 본문 HTML 뒤에 붙인다 */
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [prefix, setPrefix] = useState<string>("발달");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  /** 발달·부모이야기 글쓰기와 같이 선택 입력 — 나중에 수정할 때 검증에 쓴다 */
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
    if (room) setPrefix((PREFIXES_BY_ROOM[room] ?? PREFIXES_BY_ROOM.youngInfant)[0]);
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
    const plainBody = htmlToPlainText(mergeTrailingSinglePhotoHtml(content, attachedPhoto));

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
          content: mergeTrailingSinglePhotoHtml(content, attachedPhoto),
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
      if (roomKind) {
        router.push(communityRoomPath[roomKind]);
      } else {
        router.push("/community");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authorEmail) return null;

  const roomLabel = roomKind ? communityRoomLabels[roomKind] : null;

  if (!roomKind) {
    return (
      <main className={nestForm.nestPage}>
        <h1 className={nestForm.nestTitle}>글쓰기</h1>
        <p className={nestForm.nestLead}>
          아이 대표 출생 연도가 없으면 영아방·토들러방·유아방 중 어디에 글을 올릴지 정할 수
          없어요.
        </p>
        <Link href="/mypage" className={nestForm.nestBtnPrimary} style={{ marginTop: "1rem" }}>
          마이페이지에서 연도 설정
        </Link>
      </main>
    );
  }

  return (
    <main className={nestForm.nestPage}>
      <h1 className={nestForm.nestTitle}>{roomLabel?.roomName}</h1>

      <p className={nestForm.nestLead} style={{ marginBottom: "1.25rem" }}>
        글 등록 안내
      </p>

      <div className={nestForm.nestNotice}>
        <p className={nestForm.nestNoticeSub} style={{ margin: 0 }}>
          이 방은 마이페이지에 등록한 <strong>대표 자녀 출생 연도</strong>에 따라 자동으로
          정해져요. 글과 댓글에는 커뮤니티에서 사용 중인 <strong>닉네임</strong>이 함께
          표시돼요. 말머리와 본문 서식을 활용해 읽기 좋게 작성해 주세요. 수정 비밀번호를
          설정해 두면 글 수정 전에 한 번 더 확인할 수 있어요.
        </p>
      </div>

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
            {(PREFIXES_BY_ROOM[roomKind] ?? PREFIXES_BY_ROOM.youngInfant).map((p) => (
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
          value={attachedPhoto}
          onChange={setAttachedPhoto}
        />

        <div>
          <label htmlFor="communityWriteEditPassword" className={nestForm.nestLabel}>
            수정 비밀번호{" "}
            <span
              style={{
                fontWeight: 400,
                color: "var(--colorMuted)",
                fontSize: "0.8em",
              }}
            >
              (나중에 수정할 때 사용해요)
            </span>
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
            href={roomKind ? communityRoomPath[roomKind] : "/community"}
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
