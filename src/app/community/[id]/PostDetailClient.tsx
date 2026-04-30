"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import nestForm from "@/app/nestForm.module.css";
import { displayCommunityNickname } from "@/lib/communityBoard";
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
  postAuthorEmail: string;
  editPassword?: string;
  anonymousMode: boolean;
  listHref: string;
};

export function PostDetailClient({
  postId,
  postAuthorEmail,
  editPassword,
  anonymousMode,
  listHref,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);

  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [editPasswordInput, setEditPasswordInput] = useState("");
  const [editPasswordError, setEditPasswordError] = useState("");
  const editPasswordInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deletePasswordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = readLoginSession();
    setAuthorEmail(session?.email ?? null);

    Promise.all([
      fetch(`/api/posts/${postId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/posts/${postId}/comments`).then((r) => r.json()),
    ]).then(([, commentsData]) => {
      setComments(commentsData as Comment[]);
    });
  }, [postId]);

  useEffect(() => {
    if (replyTarget) {
      setTimeout(() => replyTextareaRef.current?.focus(), 80);
    }
  }, [replyTarget]);

  useEffect(() => {
    if (showEditPasswordModal) {
      setTimeout(() => editPasswordInputRef.current?.focus(), 80);
    }
  }, [showEditPasswordModal]);

  async function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentText.trim() || !authorEmail) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
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
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          authorEmail,
          parentId: replyTarget.id,
        }),
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

  function handleEditClickWithPasswordGate() {
    setEditPasswordInput("");
    setEditPasswordError("");
    setShowEditPasswordModal(true);
  }

  function handleDeleteClick() {
    setDeletePasswordInput("");
    setDeletePasswordError("");
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!authorEmail) return;

    const needsPw = !!editPassword && editPassword.length > 0;
    if (needsPw) {
      if (!deletePasswordInput.trim()) {
        setDeletePasswordError("비밀번호를 입력해 주세요.");
        return;
      }
      if (deletePasswordInput !== editPassword) {
        setDeletePasswordError("비밀번호가 일치하지 않습니다.");
        return;
      }
    }

    setIsDeleting(true);
    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorEmail }),
    });
    setIsDeleting(false);

    if (!res.ok) {
      setDeletePasswordError("삭제에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    setShowDeleteModal(false);
    router.push(listHref);
  }

  function handleEditPasswordConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const needsPw = !!editPassword && editPassword.length > 0;
    if (needsPw) {
      if (!editPasswordInput.trim()) {
        setEditPasswordError("수정 비밀번호를 입력해 주세요.");
        return;
      }
      if (editPasswordInput !== editPassword) {
        setEditPasswordError("수정 비밀번호가 일치하지 않습니다.");
        return;
      }
      setShowEditPasswordModal(false);
      router.push(
        `/community/${postId}/edit?pw=${encodeURIComponent(editPasswordInput)}`,
      );
      return;
    }
    setShowEditPasswordModal(false);
    router.push(`/community/${postId}/edit`);
  }

  const canEditPost =
    !!authorEmail && !!postAuthorEmail && postAuthorEmail === authorEmail;

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
        <button
          type="button"
          onClick={() => router.push(listHref)}
          className={nestForm.nestBtnSecondary}
        >
          목록
        </button>
        {canEditPost ? (
          <>
            <button
              type="button"
              onClick={handleEditClickWithPasswordGate}
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

      <section>
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
                    {!anonymousMode && (
                      <>
                        <span style={{ fontWeight: 600, color: "var(--colorMuted)" }}>
                          {displayCommunityNickname(comment.authorNickname)}
                        </span>
                        <span aria-hidden>·</span>
                      </>
                    )}
                    <span>{formatDate(comment.createdAt)}</span>
                    {authorEmail && (
                      <button
                        type="button"
                        onClick={() => { setReplyTarget(comment); setReplyText(""); }}
                        className={nestForm.nestReplyBtn}
                      >
                        답글
                      </button>
                    )}
                  </div>
                  <p className={nestForm.nestCommentBody}>{comment.content}</p>
                </div>

                {(repliesByParent[comment.id] ?? []).map((reply) => (
                  <div key={reply.id} className={nestForm.nestReplyItem}>
                    <div className={nestForm.nestCommentMeta}>
                      <span className={nestForm.nestReplyPrefix}>↳</span>
                      {!anonymousMode && (
                        <>
                          <span style={{ fontWeight: 600, color: "var(--colorMuted)" }}>
                            {displayCommunityNickname(reply.authorNickname)}
                          </span>
                          <span aria-hidden>·</span>
                        </>
                      )}
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
              placeholder={
                anonymousMode
                  ? "댓글은 익명으로 표시돼요"
                  : "댓글은 마이페이지 닉네임으로 표시돼요"
              }
              className={`${nestForm.nestTextarea} ${nestForm.nestTextareaGrow}`}
            />
            <div className={nestForm.nestCommentFormActions}>
              <button
                type="button"
                onClick={() => router.push(listHref)}
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1rem 0" }}>
            <p className={`${nestForm.nestMuted} ${nestForm.nestTextCenter}`}>
              <Link href="/login" className={nestForm.nestLink}>
                로그인
              </Link>
              하면 댓글을 남길 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => router.push(listHref)}
              className={nestForm.nestBtnSecondary}
            >
              목록
            </button>
          </div>
        )}
      </section>

      {showEditPasswordModal && mounted && createPortal(
        <div
          className={nestForm.nestModalBackdrop}
          onClick={() => setShowEditPasswordModal(false)}
        >
          <div
            className={nestForm.nestModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="비밀번호 입력"
          >
            <div className={nestForm.nestModalHeader}>
              <p className={nestForm.nestModalTitle}>비밀번호 입력</p>
              <button
                type="button"
                onClick={() => setShowEditPasswordModal(false)}
                className={nestForm.nestModalClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditPasswordConfirm} className={nestForm.nestModalForm}>
              {editPassword && editPassword.length > 0 ? (
                <input
                  ref={editPasswordInputRef}
                  type="password"
                  value={editPasswordInput}
                  onChange={(e) => setEditPasswordInput(e.target.value)}
                  placeholder="글 등록 시 입력한 수정 비밀번호"
                  className={nestForm.nestInput}
                />
              ) : (
                <p className={nestForm.nestNoticeSub} style={{ margin: 0 }}>
                  등록할 때 수정 비밀번호를 두지 않았어요. 확인을 누르면 수정 화면으로
                  이동합니다.
                </p>
              )}
              {editPasswordError ? (
                <p className={nestForm.nestError}>{editPasswordError}</p>
              ) : null}
              <div className={nestForm.nestModalActions}>
                <button
                  type="button"
                  onClick={() => setShowEditPasswordModal(false)}
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
              {editPassword && editPassword.length > 0 ? (
                <input
                  ref={deletePasswordInputRef}
                  type="password"
                  value={deletePasswordInput}
                  onChange={(e) => setDeletePasswordInput(e.target.value)}
                  placeholder="등록 시 입력한 비밀번호"
                  className={nestForm.nestInput}
                  autoFocus
                />
              ) : (
                <p className={nestForm.nestNoticeSub} style={{ margin: 0 }}>
                  게시글을 삭제하면 복구할 수 없어요. 삭제하시겠어요?
                </p>
              )}
              {deletePasswordError ? (
                <p className={nestForm.nestError}>{deletePasswordError}</p>
              ) : null}
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
