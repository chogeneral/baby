"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { BoardRichTextEditor } from "@/components/BoardRichTextEditor";
import { BoardSinglePhotoSection } from "@/components/BoardSinglePhotoSection";
import {
  communityRoomLabels,
  effectiveBoardKind,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";
import { findBannedWord } from "@/lib/contentFilter";
import {
  mergeTrailingSinglePhotoHtml,
  splitTrailingPhotosHtml,
  isMergedPostBodyEmpty,
} from "@/lib/boardSinglePhotoHtml";
import { htmlToPlainText } from "@/lib/postHtmlUtils";
import type { PostRecord } from "@/lib/postStore";
import {
  REGION_POST_TYPE_OPTIONS,
  isValidRegionPostType,
} from "@/lib/regionPostTypes";

/** 아기이야기 말머리 — 작성 화면과 동일한 후보를 둔다 */
const babyStoryPrefixes = [
  "언어",
  "놀이",
  "성장",
  "발달",
  "식습관",
  "질문있어요",
] as const;

function CommunityPostEditInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 상세 모달에서 맞춘 비밀번호를 쿼리로 넘기며, 저장 시 PUT 에도 동일 값을 실어 보낸다 */
  const pwParam = searchParams.get("pw") ?? "";

  const [post, setPost] = useState<PostRecord | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  /** 연령방·꼬꼬마 공통 — 본문 아래 사진(여러 장), 저장 시 본문 HTML 뒤에 붙임 */
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [prefix, setPrefix] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  /** 글에 수정 비밀번호가 있을 때만 PUT 에 포함 */
  const [editPasswordForSubmit, setEditPasswordForSubmit] = useState("");

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setSessionEmail(session.email);

    fetch(`/api/posts/${id}?skipView=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setPost(null);
          setIsLoading(false);
          return;
        }
        const p = data as PostRecord;
        if (p.authorEmail !== session.email) {
          setPost(null);
          setIsLoading(false);
          return;
        }

        const kind = effectiveBoardKind(p);
        const storedPw = p.editPassword;
        if (storedPw != null && storedPw.length > 0 && pwParam !== storedPw) {
          /* URL 에 비밀번호가 없거나 틀리면 상세 모달을 거치지 않은 접근으로 본다 */
          setPost(null);
          setIsLoading(false);
          return;
        }

        setPost(p);
        setTitle(p.title);
        const split = splitTrailingPhotosHtml(p.content);
        setContent(split.bodyHtml);
        setAttachedPhotos(split.photoDataUrls);
        setEditPasswordForSubmit(
          storedPw != null && storedPw.length > 0 ? pwParam : "",
        );
        if (kind === "babyStory") {
          const list = babyStoryPrefixes as readonly string[];
          setPrefix(p.prefix && list.includes(p.prefix) ? p.prefix : babyStoryPrefixes[0]);
        } else if (kind === "regionNearby") {
          setPrefix(
            p.prefix && isValidRegionPostType(p.prefix)
              ? p.prefix
              : REGION_POST_TYPE_OPTIONS[0],
          );
        }
        setIsLoading(false);
      });
  }, [id, pwParam, router]);

  const roomKind: CommunityRoomKind | null = post ? effectiveBoardKind(post) : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionEmail || !post || !roomKind) return;

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
      const needsEditPw =
        !!post.editPassword && post.editPassword.length > 0;

      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: mergeTrailingSinglePhotoHtml(content, attachedPhotos),
          authorEmail: sessionEmail,
          ...(roomKind === "babyStory" || roomKind === "regionNearby" ? { prefix } : {}),
          ...(needsEditPw ? { editPassword: editPasswordForSubmit } : {}),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "수정에 실패했습니다.");
        return;
      }

      router.push(`/community/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMessage}>불러오는 중…</p>
      </main>
    );
  }

  if (!post || !sessionEmail) {
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMuted}>글을 불러올 수 없거나 수정 권한이 없습니다.</p>
        <Link href="/community" className={nestForm.nestLink} style={{ marginTop: "1rem", display: "inline-block" }}>
          목록으로
        </Link>
      </main>
    );
  }

  const roomLabel = communityRoomLabels[roomKind!].roomName;

  return (
    <main className={nestForm.nestPage}>
      <h1 className={nestForm.nestTitle}>{roomLabel}</h1>

     

      <div className={nestForm.nestNotice}>
        <p className={nestForm.nestNoticeSub} style={{ margin: 0 }}>
          작성자 본인만 수정할 수 있어요. 저장하면 상세 화면에 바로 반영돼요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={nestForm.nestForm}>
        {roomKind === "babyStory" ? (
          <div>
            <label htmlFor="editPostPrefix" className={nestForm.nestLabel}>
              말머리
            </label>
            <select
              id="editPostPrefix"
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
        ) : null}
        {roomKind === "regionNearby" ? (
          <div>
            <label htmlFor="editRegionPostType" className={nestForm.nestLabel}>
              타입
            </label>
            <select
              id="editRegionPostType"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className={nestForm.nestSelect}
            >
              {REGION_POST_TYPE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="editPostTitle" className={nestForm.nestLabel}>
            제목
          </label>
          <input
            id="editPostTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className={nestForm.nestInput}
          />
        </div>

        <div>
          <label htmlFor="editPostContent" className={nestForm.nestLabel}>
            내용
          </label>
          <BoardRichTextEditor
            id="editPostContent"
            value={content}
            onChange={setContent}
            placeholder="내용을 입력해 주세요"
          />
        </div>

        <BoardSinglePhotoSection
          sectionId="communityEditPhoto"
          value={attachedPhotos}
          onChange={setAttachedPhotos}
        />

        {error ? <p className={nestForm.nestError}>{error}</p> : null}

        <div className={nestForm.nestActions}>
          <Link
            href={`/community/${id}`}
            className={`${nestForm.nestBtnSecondary} ${nestForm.flex1}`}
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${nestForm.nestBtnPrimary} ${nestForm.flex1}`}
          >
            {isSubmitting ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function CommunityPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className={nestForm.nestPage}>
          <p className={nestForm.nestMessage}>불러오는 중…</p>
        </main>
      }
    >
      <CommunityPostEditInner params={params} />
    </Suspense>
  );
}
