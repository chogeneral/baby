"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ContentTopicKind } from "@/lib/contentTopic";
import { contentTopicEditPath, contentTopicPageInfo } from "@/lib/contentTopic";
import nestForm from "@/app/nestForm.module.css";
import styles from "@/app/contentPage.module.css";
import { readLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";

type Comment = {
  id: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  parentId?: string;
};

type Props = {
  postId: string;
  topic: ContentTopicKind;
  postAuthorEmail: string;
  password?: string;
  showAuthorInMeta: boolean;
};

export function ContentTopicDetailClient({
  postId,
  topic,
  postAuthorEmail,
  password,
  showAuthorInMeta: _showAuthorInMeta,
}: Props) {
  const router = useRouter();
  const info = contentTopicPageInfo[topic];

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const session = readLoginSession();
    setAuthorEmail(session?.email ?? null);

    Promise.all([
      // 조회수 증가
      fetch(`/api/content-topic-posts/${postId}`),
      fetch(`/api/content-topic-posts/${postId}/comments`).then((r) => r.json()),
    ]).then(([, commentsData]) => {
      setComments(commentsData as Comment[]);
    });
  }, [postId]);

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
    const authorMatches =
      !!authorEmail && !!postAuthorEmail && postAuthorEmail === authorEmail;
    if (authorMatches) {
      router.push(contentTopicEditPath(topic, postId));
      return;
    }
    setPasswordInput("");
    setPasswordError("");
    setShowPasswordModal(true);
  }

  function handleDeleteClick() {
    setDeletePasswordInput("");
    setDeletePasswordError("");
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsDeleting(true);
    const res = await fetch(`/api/content-topic-posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorEmail: authorEmail ?? undefined,
        password: deletePasswordInput.trim() || undefined,
      }),
    });
    setIsDeleting(false);

    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      setDeletePasswordError(data.message ?? "삭제에 실패했습니다.");
      return;
    }

    setShowDeleteModal(false);
    router.push(info.backPath);
  }

  async function handlePasswordConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError("비밀번호를 입력해 주세요.");
      return;
    }

    const res = await fetch(`/api/content-topic-posts/${postId}/check-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.trim() }),
    });

    if (!res.ok) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setShowPasswordModal(false);
    router.push(contentTopicEditPath(topic, postId, passwordInput.trim()));
  }

  async function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentText.trim() || !authorEmail) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/content-topic-posts/${postId}/comments`, {
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
      const res = await fetch(`/api/content-topic-posts/${postId}/comments`, {
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

  const canEditAsAuthor =
    !!authorEmail && !!postAuthorEmail && postAuthorEmail === authorEmail;
  const hasPassword = !!password;
  const showEditButton = canEditAsAuthor || hasPassword;

  const topComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = [...(acc[c.parentId] ?? []), c];
    }
    return acc;
  }, {});

  return (
    <>
      <div className={nestForm.nestDetailActionRow}>
        <Link href={info.backPath} className={nestForm.nestBtnSecondary}>
          목록
        </Link>
        {showEditButton ? (
          <>
            <button
              type="button"
              onClick={handleEditClick}
              className={nestForm.nestBtnEditBrown}
            >
              수정하기
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className={nestForm.nestBtnDeleteRed}
            >
              삭제하기
            </button>
          </>
        ) : null}
      </div>

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

      {showPasswordModal && mounted && createPortal(
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
        </div>,
        document.body,
      )}

      {showDeleteModal && mounted && createPortal(
        <div
          className={nestForm.nestModalBackdrop}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className={nestForm.nestModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="게시글 삭제"
          >
            <div className={nestForm.nestModalHeader}>
              <p className={nestForm.nestModalTitle}>게시글 삭제</p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className={nestForm.nestModalClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleDeleteConfirm} className={nestForm.nestModalForm}>
              <input
                type="password"
                value={deletePasswordInput}
                onChange={(e) => setDeletePasswordInput(e.target.value)}
                placeholder="작성 시 입력한 비밀번호"
                className={nestForm.nestInput}
                autoFocus
              />
              {deletePasswordError && (
                <p className={nestForm.nestError}>{deletePasswordError}</p>
              )}
              <div className={nestForm.nestModalActions}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className={nestForm.nestBtnSecondary}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className={nestForm.nestBtnDeleteRed}
                  style={{ marginLeft: "auto" }}
                >
                  {isDeleting ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {replyTarget && mounted && createPortal(
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
        </div>,
        document.body,
      )}
    </>
  );
}
