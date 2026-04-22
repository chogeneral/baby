"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ContentTopicKind } from "@/lib/contentTopic";
import { contentTopicPageInfo } from "@/lib/contentTopic";
import styles from "@/app/contentPage.module.css";
import nestForm from "@/app/nestForm.module.css";

type Post = {
  id: string;
  topic: ContentTopicKind;
  title: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  photoDataUrl?: string;
  viewCount?: number;
  password?: string;
};

type Props = { id: string; topic: ContentTopicKind };

export function ContentTopicDetail({ id, topic }: Props) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const info = contentTopicPageInfo[topic];

  useEffect(() => {
    fetch(`/api/content-topic-posts/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setPost(data as Post); });
  }, [id]);

  useEffect(() => {
    if (showPasswordModal) {
      setTimeout(() => passwordInputRef.current?.focus(), 80);
    }
  }, [showPasswordModal]);

  function handleEditClick() {
    setPasswordInput("");
    setPasswordError("");
    setShowPasswordModal(true);
  }

  async function handlePasswordConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError("비밀번호를 입력해 주세요.");
      return;
    }

    const res = await fetch(`/api/content-topic-posts/${id}/check-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.trim() }),
    });

    if (!res.ok) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setShowPasswordModal(false);
    router.push(`/${topic === "development" ? "development" : "parent-stories"}/${id}/edit?pw=${encodeURIComponent(passwordInput.trim())}`);
  }

  if (notFound) {
    return (
      <main className={styles.contentPage}>
        <p className={styles.contentLead}>글을 찾을 수 없어요.</p>
        <Link href={info.backPath} className={styles.contentWriteLink} style={{ marginTop: "1rem", display: "inline-flex" }}>
          목록으로
        </Link>
      </main>
    );
  }

  if (!post) return null;

  const hasPassword = !!post.password;

  return (
    <main className={styles.contentPage}>
      <h1 className={styles.contentTitle}>{post.title}</h1>

      <div className={styles.detailMeta}>
        <span>{post.authorNickname || "익명"}</span>
        <span aria-hidden>·</span>
        <span>{post.createdAt.slice(0, 10)}</span>
        <span aria-hidden>·</span>
        <span>조회 {post.viewCount ?? 0}</span>
      </div>

      {post.photoDataUrl && (
        <div className={styles.detailPhoto}>
          <img src={post.photoDataUrl} alt="첨부 사진" className={styles.detailPhotoImg} />
        </div>
      )}

      <div className={styles.detailContent}>
        {post.content.split("\n").map((line, i) => (
          <p key={i}>{line || " "}</p>
        ))}
      </div>

      <div className={styles.detailActions}>
        <Link href={info.backPath} className={styles.detailBtnSecondary}>
          목록
        </Link>
        {hasPassword && (
          <button type="button" onClick={handleEditClick} className={styles.detailBtnSecondary}>
            수정하기
          </button>
        )}
      </div>

      {showPasswordModal && (
        <div className={nestForm.nestModalBackdrop} onClick={() => setShowPasswordModal(false)}>
          <div
            className={nestForm.nestModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="비밀번호 확인"
          >
            <div className={nestForm.nestModalHeader}>
              <p className={nestForm.nestModalTitle}>비밀번호 확인</p>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className={nestForm.nestModalClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePasswordConfirm} className={nestForm.nestModalForm}>
              <input
                ref={passwordInputRef}
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="작성 시 입력한 비밀번호"
                className={nestForm.nestInput}
              />
              {passwordError && (
                <p className={nestForm.nestError}>{passwordError}</p>
              )}
              <div className={nestForm.nestModalActions}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className={nestForm.nestBtnSecondary}
                >
                  취소
                </button>
                <button type="submit" className={nestForm.nestBtnPrimary}>
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
