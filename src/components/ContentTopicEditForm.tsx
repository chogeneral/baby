"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { BoardRichTextEditor } from "@/components/BoardRichTextEditor";
import { BoardSinglePhotoSection } from "@/components/BoardSinglePhotoSection";
import {
  contentTopicDetailPath,
  contentTopicPageInfo,
  type ContentTopicKind,
} from "@/lib/contentTopic";
import { readLoginSession } from "@/lib/loginSession";
import {
  mergeTrailingSinglePhotoHtml,
  splitTrailingPhotosHtml,
  isMergedPostBodyEmpty,
} from "@/lib/boardSinglePhotoHtml";

type LoadedPost = {
  id: string;
  title: string;
  content: string;
  authorEmail: string;
  password?: string;
};

type Props = { id: string; topic: ContentTopicKind };

export function ContentTopicEditForm({ id, topic }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 비작성자가 비밀번호로 수정할 때 목록·상세에서 넘겨주는 값(작성자는 쿼리 없이 진입 가능) */
  const passwordFromQuery = searchParams.get("pw") ?? "";

  const info = contentTopicPageInfo[topic];

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  /** 글쓰기와 동일 — 본문 아래 사진(여러 장), 저장 시 HTML 맨 뒤에 붙인다 */
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  /** 불러온 글 기준 작성자 여부 — true면 PUT 시 authorEmail만 보내면 됨 */
  const [editAsAuthor, setEditAsAuthor] = useState(false);
  /** 비작성자·비밀번호 수정 시 PUT에 넣을 비밀번호(쿼리에서 온 값과 동일) */
  const [passwordForSubmit, setPasswordForSubmit] = useState("");
  /** 작성자 수정 시 세션 이메일 */
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    const session = readLoginSession();
    const email = session?.email ?? null;
    setSessionEmail(email);

    fetch(`/api/content-topic-posts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          router.replace(info.backPath);
          return;
        }

        const post = data as LoadedPost;
        const isAuthor = !!email && post.authorEmail === email;
        const passwordOk =
          !!post.password &&
          post.password.length > 0 &&
          passwordFromQuery === post.password;

        /* 작성자도 아니고 비밀번호도 맞지 않으면 수정 불가 — 목록으로 돌려보냄 */
        if (!isAuthor && !passwordOk) {
          router.replace(info.backPath);
          return;
        }

        setEditAsAuthor(isAuthor);
        setPasswordForSubmit(isAuthor ? "" : passwordFromQuery);
        setTitle(post.title);
        const split = splitTrailingPhotosHtml(post.content);
        setContent(split.bodyHtml);
        setAttachedPhotos(split.photoDataUrls);
        setIsLoading(false);
      });
  }, [id, passwordFromQuery, router, info.backPath]);

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
      const mergedContent = mergeTrailingSinglePhotoHtml(content, attachedPhotos);
      const body: { title: string; content: string; authorEmail?: string; password?: string } = {
        title,
        content: mergedContent,
      };

      if (editAsAuthor) {
        if (!sessionEmail) {
          setError("로그인이 필요합니다.");
          return;
        }
        body.authorEmail = sessionEmail;
      } else {
        body.password = passwordForSubmit;
      }

      const res = await fetch(`/api/content-topic-posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "수정에 실패했습니다.");
        return;
      }

      router.push(contentTopicDetailPath(topic, id));
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

  return (
    <main className={nestForm.nestPage}>
      <p className={nestForm.nestTag}>글 수정</p>
      <h1 className={nestForm.nestTitle}>{info.title}</h1>

      <p className={nestForm.nestLead} style={{ marginBottom: "1.25rem" }}>
        글 수정 안내
      </p>

      <div className={nestForm.nestNotice}>
        <p className={nestForm.nestNoticeSub} style={{ margin: 0 }}>
          본문 서식은 다시 저장할 때까지 그대로 유지돼요. 저장하면 상세 화면에 바로 반영돼요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={nestForm.nestForm}>
        <div>
          <label htmlFor="editTitle" className={nestForm.nestLabel}>
            제목
          </label>
          <input
            id="editTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className={nestForm.nestInput}
          />
        </div>

        <div>
          <label htmlFor="editBody" className={nestForm.nestLabel}>
            내용
          </label>
          <BoardRichTextEditor
            id="editBody"
            value={content}
            onChange={setContent}
            placeholder="내용을 입력해 주세요"
          />
        </div>

        <BoardSinglePhotoSection
          sectionId="contentTopicEditPhoto"
          value={attachedPhotos}
          onChange={setAttachedPhotos}
        />

        {error ? <p className={nestForm.nestError}>{error}</p> : null}

        <div className={nestForm.nestActions}>
          <Link
            href={contentTopicDetailPath(topic, id)}
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
