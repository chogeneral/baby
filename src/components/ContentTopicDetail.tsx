"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ContentTopicKind } from "@/lib/contentTopic";
import { contentTopicPageInfo } from "@/lib/contentTopic";
import styles from "@/app/contentPage.module.css";
import nestForm from "@/app/nestForm.module.css";
import { readLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";

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

type Comment = {
  id: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  parentId?: string;
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

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const info = contentTopicPageInfo[topic];

  useEffect(() => {
    const session = readLoginSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 댓글 작성 가능 여부(로그인)를 불러온 직후 동기화
    setAuthorEmail(session?.email ?? null);

    Promise.all([
      fetch(`/api/content-topic-posts/${id}`).then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      }),
      fetch(`/api/content-topic-posts/${id}/comments`).then((r) => r.json()),
    ]).then(([postData, commentsData]) => {
      if (postData) setPost(postData as Post);
      setComments(commentsData as Comment[]);
    });
  }, [id]);

  useEffect(() => {
    if (showPasswordModal) {
      setTimeout(() => passwordInputRef.current?.focus(), 80);
    }
  }, [showPasswordModal]);

  useEffect(() => {
    if (replyTarget) {
      setTimeout(() => replyTextareaRef.current?.focus(), 80);
    }
  }, [replyTarget]);

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

  async function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentText.trim() || !authorEmail) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/content-topic-posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText, authorEmail }),
      });

      if (!res.ok) return;

      const newComment = (await res.json()) as Comment;
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReplySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!replyText.trim() || !authorEmail || !replyTarget) return;

    setIsReplySubmitting(true);
    try {
      const res = await fetch(`/api/content-topic-posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText, authorEmail, parentId: replyTarget.id }),
      });

      if (!res.ok) return;

      const newReply = (await res.json()) as Comment;
      setComments((prev) => [...prev, newReply]);
      setReplyText("");
      setReplyTarget(null);
    } finally {
      setIsReplySubmitting(false);
    }
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
  const topComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = [...(acc[c.parentId] ?? []), c];
    }
    return acc;
  }, {});

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

      {/* 댓글 섹션 */}
      <section style={{ marginTop: "2rem" }}>
        <h2 className={nestForm.nestSectionTitle}>
          댓글 <span className={nestForm.nestAccentCount}>{comments.length}</span>
        </h2>

        <ul className={nestForm.nestCommentList}>
          {topComments.length === 0 ? (
            <li className={nestForm.nestCommentEmpty}>첫 번째 댓글을 남겨보세요.</li>
          ) : (
            topComments.map((comment) => (
              <li key={comment.id}>
                <div className={nestForm.nestCommentItem}>
                  <div className={nestForm.nestCommentMeta}>
                    <span style={{ fontWeight: 600, color: "var(--colorMuted)" }}>
                      {comment.authorNickname || "익명"}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(comment.createdAt)}</span>
                    {authorEmail && (
                      <button
                        type="button"
                        onClick={() => { setReplyTarget(comment); setReplyText(""); }}
                        className={nestForm.nestReplyBtn}
                      >
                        대댓글
                      </button>
                    )}
                  </div>
                  <p className={nestForm.nestCommentBody}>{comment.content}</p>
                </div>

                {(repliesByParent[comment.id] ?? []).map((reply) => (
                  <div key={reply.id} className={nestForm.nestReplyItem}>
                    <div className={nestForm.nestCommentMeta}>
                      <span className={nestForm.nestReplyPrefix}>↳</span>
                      <span style={{ fontWeight: 600, color: "var(--colorMuted)" }}>
                        {reply.authorNickname || "익명"}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className={nestForm.nestCommentBody}>{reply.content}</p>
                  </div>
                ))}
              </li>
            ))
          )}
        </ul>

        {authorEmail ? (
          <form onSubmit={handleCommentSubmit} className={nestForm.nestCommentForm}>
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글은 마이페이지 닉네임으로 표시돼요"
              className={`${nestForm.nestTextarea} ${nestForm.nestTextareaGrow}`}
            />
            <div className={nestForm.nestCommentFormActions}>
              <button
                type="button"
                onClick={() => router.push(info.backPath)}
                className={nestForm.nestBtnSecondary}
              >
                목록
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className={nestForm.nestBtnPrimary}
              >
                {isSubmitting ? "…" : "등록"}
              </button>
            </div>
          </form>
        ) : (
          <p className={`${nestForm.nestMuted} ${nestForm.nestTextCenter}`} style={{ padding: "1rem 0" }}>
            <Link href="/login" className={nestForm.nestLink}>로그인</Link>하면 댓글을 남길 수 있어요.
          </p>
        )}
      </section>

      {/* 비밀번호 확인 모달 */}
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

      {/* 대댓글 모달 */}
      {replyTarget && (
        <div className={nestForm.nestModalBackdrop} onClick={() => setReplyTarget(null)}>
          <div
            className={nestForm.nestModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="대댓글 작성"
          >
            <div className={nestForm.nestModalHeader}>
              <p className={nestForm.nestModalTitle}>대댓글 작성</p>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className={nestForm.nestModalClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleReplySubmit} className={nestForm.nestModalForm}>
              <textarea
                ref={replyTextareaRef}
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="대댓글을 입력해 주세요"
                className={nestForm.nestTextarea}
              />
              <div className={nestForm.nestModalActions}>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className={nestForm.nestBtnSecondary}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isReplySubmitting || !replyText.trim()}
                  className={nestForm.nestBtnPrimary}
                >
                  {isReplySubmitting ? "등록 중…" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
