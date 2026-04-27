"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { BoardRichTextEditor } from "@/components/BoardRichTextEditor";
import { BoardSinglePhotoSection } from "@/components/BoardSinglePhotoSection";
import type { RegionCoords } from "@/components/RegionLiveMap";
import { readLoginSession } from "@/lib/loginSession";
import { findBannedWord } from "@/lib/contentFilter";
import {
  mergeTrailingSinglePhotoHtml,
  isMergedPostBodyEmpty,
} from "@/lib/boardSinglePhotoHtml";
import { htmlToPlainText } from "@/lib/postHtmlUtils";
import {
  REGION_POST_TYPE_OPTIONS,
  type RegionPostType,
} from "@/lib/regionPostTypes";

const REGION_COORDS_STORAGE_KEY = "regionBoardLastCoords";

/**
 * 지역 **글쓰기** — 지도는 두지 않고, `/region` 에서 잡힌 좌표만 `sessionStorage` 로 받아 등록한다.
 * 유형은 `posts.prefix` 에 저장되며 `regionPostTypes` 의 고정 목록만 API 에서 허용한다.
 */
export default function RegionWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [editPassword, setEditPassword] = useState("");
  const [postType, setPostType] = useState<RegionPostType>(REGION_POST_TYPE_OPTIONS[0]);
  const [coords, setCoords] = useState<RegionCoords | null>(null);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setAuthorEmail(session.email);
  }, [router]);

  // 지역 메인·지도에서 잡힌 좌표(세션) — 지도 UI 없이도 등록 API에 위경도를 넣기 위해 쓴다.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REGION_COORDS_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as RegionCoords;
        if (typeof p.lat === "number" && typeof p.lng === "number") {
          setCoords(p);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!authorEmail) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (!coords) {
      setError("지역 페이지에서 위치를 먼저 잡아 온 뒤 글쓰기를 이용해 주세요.");
      return;
    }
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    if (isMergedPostBodyEmpty(content, attachedPhotos)) {
      setError("내용을 입력해 주세요.");
      return;
    }

    const bodyHtml = mergeTrailingSinglePhotoHtml(content, attachedPhotos);
    const plain = htmlToPlainText(bodyHtml);
    if (findBannedWord(title) || findBannedWord(plain)) {
      setError("제목·내용에 사용할 수 없는 표현이 있습니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/region/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: bodyHtml,
          authorEmail,
          prefix: postType,
          latitude: coords.lat,
          longitude: coords.lng,
          ...(editPassword.trim() ? { editPassword: editPassword.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "등록에 실패했습니다.");
        return;
      }
      router.push("/region");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authorEmail) {
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMessage}>확인 중…</p>
      </main>
    );
  }

  return (
    <main className={nestForm.nestPage}>
      <h1 className={nestForm.nestTitle}>지역</h1>
      <p className={nestForm.nestLead} style={{ marginBottom: "1.25rem" }}>
        동네이웃과 다양한 이야기를 해보세요
      </p>

      {!coords ? (
        <p className={nestForm.nestError} style={{ marginBottom: "1rem" }}>
          지역 페이지에서 위치 권한을 허용하고 지도에 내 위치가 잡힌 뒤, 이 화면으로 돌아와 주세요. (같은
          브라우저·탭에서 이어 쓰면 좌표가 맞춰집니다.)
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className={nestForm.nestForm} noValidate>
        <div>
          <label htmlFor="regionWriteType" className={nestForm.nestLabel}>
            타입
          </label>
          <select
            id="regionWriteType"
            className={nestForm.nestSelect}
            value={postType}
            onChange={(e) => setPostType(e.target.value as RegionPostType)}
          >
            {REGION_POST_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="regionWriteTitle" className={nestForm.nestLabel}>
            제목
          </label>
          <input
            id="regionWriteTitle"
            type="text"
            className={nestForm.nestInput}
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="regionWriteContent" className={nestForm.nestLabel}>
            내용
          </label>
          <BoardRichTextEditor
            id="regionWriteContent"
            value={content}
            onChange={setContent}
            placeholder="이 동네 이야기를 남겨 주세요"
          />
        </div>
        <BoardSinglePhotoSection
          sectionId="regionWritePhoto"
          value={attachedPhotos}
          onChange={setAttachedPhotos}
        />
        <div>
          <label htmlFor="regionWriteEditPw" className={nestForm.nestLabel}>
            수정 비밀번호 (선택)
          </label>
          <input
            id="regionWriteEditPw"
            type="password"
            className={nestForm.nestInput}
            maxLength={50}
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="나중에 수정·삭제할 때 사용"
            autoComplete="new-password"
          />
        </div>
        {error ? <p className={nestForm.nestError}>{error}</p> : null}
        <div className={nestForm.nestActions}>
          <Link
            href="/region"
            className={`${nestForm.nestBtnSecondary} ${nestForm.flex1}`}
          >
            취소
          </Link>
          <button
            type="submit"
            className={`${nestForm.nestBtnPrimary} ${nestForm.flex1}`}
            disabled={submitting || !coords}
          >
            {submitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>
    </main>
  );
}
