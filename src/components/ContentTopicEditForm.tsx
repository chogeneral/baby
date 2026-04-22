"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { contentTopicPageInfo, type ContentTopicKind } from "@/lib/contentTopic";

type Post = {
  id: string;
  title: string;
  content: string;
  photoDataUrl?: string;
};

type Props = { id: string; topic: ContentTopicKind };

export function ContentTopicEditForm({ id, topic }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const password = searchParams.get("pw") ?? "";
  const info = contentTopicPageInfo[topic];

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!password) {
      router.replace(info.backPath);
      return;
    }
    fetch(`/api/content-topic-posts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.replace(info.backPath); return; }
        const post = data as Post;
        setTitle(post.title);
        setContent(post.content);
        setPhotoPreview(post.photoDataUrl ?? null);
        setIsLoading(false);
      });
  }, [id, password, router, info.backPath]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPhotoPreview(reader.result as string); setRemovePhoto(false); };
    reader.readAsDataURL(file);
  }

  function handlePhotoRemove() {
    setPhotoPreview(null);
    setRemovePhoto(true);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) { setError("제목을 입력해 주세요."); return; }
    if (!content.trim()) { setError("내용을 입력해 주세요."); return; }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/content-topic-posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          title,
          content,
          photoDataUrl: removePhoto ? null : photoPreview,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "수정에 실패했습니다.");
        return;
      }

      const detailPath = topic === "development" ? `/development/${id}` : `/parent-stories/${id}`;
      router.push(detailPath);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <main className={nestForm.nestPage}>
      <p className={nestForm.nestTag}>글 수정</p>
      <h1 className={nestForm.nestTitle}>{info.title}</h1>

      <form onSubmit={handleSubmit} className={nestForm.nestForm}>
        <div>
          <label htmlFor="editTitle" className={nestForm.nestLabel}>제목</label>
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
          <label htmlFor="editBody" className={nestForm.nestLabel}>내용</label>
          <textarea
            id="editBody"
            rows={12}
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
              <button type="button" onClick={handlePhotoRemove} className={nestForm.nestPhotoRemove}>
                삭제
              </button>
            </div>
          ) : (
            <label htmlFor="editPhoto" className={nestForm.nestPhotoLabel}>
              <span>+ 사진 추가 (1장)</span>
              <input
                ref={photoInputRef}
                id="editPhoto"
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
            href={topic === "development" ? `/development/${id}` : `/parent-stories/${id}`}
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
