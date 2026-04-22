"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import {
  communityRoomLabels,
  communityRoomPath,
  getCommunityRoomFromBirthYears,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";
import { findBannedWord } from "@/lib/contentFilter";

const PREFIXES_BY_ROOM: Record<string, readonly string[]> = {
  youngInfant: ["언어", "놀이", "성장", "식습관"],
  toddler:     ["언어", "놀이", "성장", "식습관"],
  preschool:   ["언어", "놀이", "성장", "식습관"],
};

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [prefix, setPrefix] = useState<string>("발달");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [writerNickname, setWriterNickname] = useState("");
  const [roomKind, setRoomKind] = useState<CommunityRoomKind | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect -- 로그인 세션으로 글쓰기 폼의 작성자·방 정보를 맞춘다 */
    setAuthorEmail(session.email);
    setWriterNickname(
      session.nickname?.trim() || session.email.split("@")[0] || "회원",
    );
    const room = getCommunityRoomFromBirthYears(
      session.childBirthYears,
      new Date(),
      session.primaryChildIndex ?? 0,
    );
    setRoomKind(room);
    if (room) setPrefix((PREFIXES_BY_ROOM[room] ?? PREFIXES_BY_ROOM.youngInfant)[0]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoRemove() {
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

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

    const bannedInTitle = findBannedWord(title);
    if (bannedInTitle) {
      setError("제목에 사용할 수 없는 표현이 포함되어 있습니다.");
      return;
    }
    const bannedInContent = findBannedWord(content);
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
          content,
          authorEmail,
          prefix,
          ...(photoPreview ? { photoDataUrl: photoPreview } : {}),
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
          <textarea
            id="postContent"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해 주세요"
            className={nestForm.nestTextarea}
          />
        </div>

        <div>
          <p className={nestForm.nestLabel}>사진첩</p>
          {photoPreview ? (
            <div className={nestForm.nestPhotoPreviewWrap}>
              <img src={photoPreview} alt="첨부 사진 미리보기" className={nestForm.nestPhotoPreview} />
              <button
                type="button"
                onClick={handlePhotoRemove}
                className={nestForm.nestPhotoRemove}
              >
                삭제
              </button>
            </div>
          ) : (
            <label htmlFor="postPhoto" className={nestForm.nestPhotoLabel}>
              <span>+ 사진 추가 (1장)</span>
              <input
                ref={photoInputRef}
                id="postPhoto"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className={nestForm.nestPhotoInput}
              />
            </label>
          )}
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
