"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import nestForm from "@/app/nestForm.module.css";
import { displayCommunityNickname } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  effectiveBoardKind,
  isKokkomaBoard,
  type CommunityRoomKind,
  type StoredCommunityBoardKind,
} from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";
import { looksLikeHtmlPostBody, moveImagesToTopInPostHtml } from "@/lib/postHtmlUtils";
import { sanitizePostHtml } from "@/lib/postHtmlSanitize";

type Post = {
  id: string;
  title: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  childBirthYear: number;
  boardKind?: StoredCommunityBoardKind;
  createdAt: string;
  /** 있으면 상세에서 수정 전 모달로 검증한다(아기이야기·꼬꼬마 동일) */
  editPassword?: string;
};

type Comment = {
  id: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  parentId?: string;
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);

  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /** 수정 비밀번호가 있으면 모달에서 확인한 뒤 편집 URL 로 이동 */
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 글·댓글 작성 가능 여부(로그인)를 불러온 직후 반영
    setAuthorEmail(session?.email ?? null);

    Promise.all([
      fetch(`/api/posts/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/posts/${id}/comments`).then((r) => r.json()),
    ]).then(([postData, commentsData]) => {
      setPost(postData as Post | null);
      setComments(commentsData as Comment[]);
      setIsLoading(false);
    });
  }, [id]);

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
      const res = await fetch(`/api/posts/${id}/comments`, {
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
      const res = await fetch(`/api/posts/${id}/comments`, {
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

  if (isLoading) {
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMessage}>불러오는 중…</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className={nestForm.nestPage}>
        <div className={nestForm.nestTextCenter}>
          <p className={nestForm.nestMuted} style={{ marginBottom: "1rem" }}>
            게시글을 찾을 수 없습니다.
          </p>
          <Link href="/community" className={nestForm.nestLink}>
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const postRoom: CommunityRoomKind = effectiveBoardKind(post);
  const anonymousMode = isKokkomaBoard(postRoom);
  const listHref = anonymousMode ? "/community/kokkoma" : communityRoomPath[postRoom];
  const canEditPost =
    !!authorEmail && !!post.authorEmail && post.authorEmail === authorEmail;

  /** 아기이야기·꼬꼬마 공통 — 저장된 수정 비밀번호가 있으면 모달에서 맞춘 뒤 edit 로 이동 */
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
    if (!post || !authorEmail) return;

    const needsPw = !!post.editPassword && post.editPassword.length > 0;
    if (needsPw) {
      if (!deletePasswordInput.trim()) {
        setDeletePasswordError("비밀번호를 입력해 주세요.");
        return;
      }
      if (deletePasswordInput !== post.editPassword) {
        setDeletePasswordError("비밀번호가 일치하지 않습니다.");
        return;
      }
    }

    setIsDeleting(true);
    const res = await fetch(`/api/posts/${post.id}`, {
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
    if (!post) return;

    const needsPw = !!post.editPassword && post.editPassword.length > 0;
    if (needsPw) {
      if (!editPasswordInput.trim()) {
        setEditPasswordError("수정 비밀번호를 입력해 주세요.");
        return;
      }
      if (editPasswordInput !== post.editPassword) {
        setEditPasswordError("수정 비밀번호가 일치하지 않습니다.");
        return;
      }
      setShowEditPasswordModal(false);
      router.push(
        `/community/${post.id}/edit?pw=${encodeURIComponent(editPasswordInput)}`,
      );
      return;
    }
    setShowEditPasswordModal(false);
    router.push(`/community/${post.id}/edit`);
  }

  const topComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = [...(acc[c.parentId] ?? []), c];
    }
    return acc;
  }, {});

  return (
    <main className={nestForm.nestPage}>
      <article className={nestForm.nestArticle}>
        {/*
         * effectiveBoardKind 로 얻는 방(아기이야기·꼬꼬마)의 표시명을
         * 제목 h1 바로 위에 둬서, 어떤 목록/게시판에서 온 글인지 맥락을 잡기 쉽게 한다
         * (기존 꼬꼬마 전용 상단 nestTag 는 이 위치로 통합해 이중 표기를 막는다)
         * 눈에 잘 띄게 nestTag(0.6875rem) 대비 2배인 nestTagLg 를 쓴다
         */}
        <p className={nestForm.nestTagLg}>
          {communityRoomLabels[postRoom].roomName}
        </p>
        <h1 className={nestForm.nestArticleTitle}>{post.title}</h1>
        {/*
         * 아기이야기: 내부 고정 리드 / 꼬꼬마: communityRoomLabels 의 subtext(비밀 우체통 안내)를
         * h1 바로 아래에 둬서 게시판 성격을 한눈에 전한다
         */}
        {!anonymousMode ? (
          <p className={nestForm.nestLead} style={{ marginBottom: "0.75rem" }}>
            우리 아이들의 이야기를 함께 나누고 공유해요
          </p>
        ) : (
          <p className={nestForm.nestLead} style={{ marginBottom: "0.75rem" }}>
            {communityRoomLabels.kokkoma.subtext}
          </p>
        )}
        <div className={nestForm.nestMeta}>
          {!anonymousMode && (
            <>
              <span>{displayCommunityNickname(post.authorNickname)}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{formatDate(post.createdAt)}</span>
        </div>
        {looksLikeHtmlPostBody(post.content) ? (
          <div
            className={nestForm.nestRichBody}
            dangerouslySetInnerHTML={{
              // reorder 후 XSS 제거(순서: 이동 → sanitize) — img src 등은 DOMPurify에서 그대로 다룬다
              __html: sanitizePostHtml(moveImagesToTopInPostHtml(post.content)),
            }}
          />
        ) : (
          <p className={nestForm.nestBody}>{post.content}</p>
        )}
      </article>

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
              {post.editPassword && post.editPassword.length > 0 ? (
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
              {post.editPassword && post.editPassword.length > 0 ? (
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
    </main>
  );
}
