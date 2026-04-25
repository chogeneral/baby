"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ContentTopicKind } from "@/lib/contentTopic";
import { contentTopicEditPath, contentTopicPageInfo } from "@/lib/contentTopic";
import styles from "@/app/contentPage.module.css";
import nestForm from "@/app/nestForm.module.css";
import { readLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";
import { looksLikeHtmlPostBody, moveImagesToTopInPostHtml } from "@/lib/postHtmlUtils";
import { sanitizePostHtml } from "@/lib/postHtmlSanitize";

type Post = {
  id: string;
  topic: ContentTopicKind;
  title: string;
  content: string;
  /** 글 작성 시 저장된 회원 이메일 — 로그인 사용자와 같으면 비밀번호 없이 수정 가능 */
  authorEmail: string;
  authorNickname: string;
  createdAt: string;
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

  /** 수정: 작성자면 바로 편집 화면으로, 비밀번호 글·비작성자면 확인 모달 */
  function handleEditClick() {
    if (!post) return;

    const authorMatches =
      !!authorEmail && !!post.authorEmail && post.authorEmail === authorEmail;

    if (authorMatches) {
      router.push(contentTopicEditPath(topic, id));
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
    if (!post) return;

    setIsDeleting(true);
    const res = await fetch(`/api/content-topic-posts/${id}`, {
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
    router.push(contentTopicEditPath(topic, id, passwordInput.trim()));
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
  /** 로그인한 사용자가 이 글의 작성자인지 — 비밀번호 없는 글은 작성자만 수정 버튼을 본다 */
  const canEditAsAuthor =
    !!authorEmail && !!post.authorEmail && post.authorEmail === authorEmail;
  const showEditButton = canEditAsAuthor || hasPassword;

  const topComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = [...(acc[c.parentId] ?? []), c];
    }
    return acc;
  }, {});

  /* 부모이야기에서만 상단에 글쓴이를 노출한다. `ContentTopicKind` 에서 발달(development) 토픽은 제거돼
   * 타입에 없으므로 `parentStories` 일 때만 비교한다. 정보(info) 는 기존처럼 날짜·조회만 둔다. */
  const showAuthorInMeta = topic === "parentStories";
  const authorLabel = post.authorNickname?.trim() ? post.authorNickname : "—";

  return (
    <main className={styles.contentPage}>
      {/*
       * 부모이야기·정보: 커뮤니티 상세와 같이 h1 위 nestTagLg(짧은 게시판명),
       * h1 아래 nestLead + contentTopicPageInfo.subtext(주제별 고정 문구)
       */}
      {info.detailTagLabel ? (
        <p className={nestForm.nestTagLg}>{info.detailTagLabel}</p>
      ) : null}
      <h1 className={styles.contentTitle}>{post.title}</h1>
      {topic === "parentStories" || topic === "info" ? (
        <p
          className={nestForm.nestLead}
          style={{ marginBottom: "0.75rem" }}
        >
          {info.subtext}
        </p>
      ) : null}

      <div className={styles.detailMeta}>
        {showAuthorInMeta ? (
          <>
            <span>글쓴이 {authorLabel}</span>
            <span aria-hidden>·</span>
          </>
        ) : null}
        <span>{post.createdAt.slice(0, 10)}</span>
        <span aria-hidden>·</span>
        <span>조회 {post.viewCount ?? 0}</span>
      </div>

      <div className={styles.detailContent}>
        {looksLikeHtmlPostBody(post.content) ? (
          <div
            className={nestForm.nestRichBody}
            dangerouslySetInnerHTML={{
              // 커뮤니티 상세와 같이: 본문 HTML 에서 img 를 먼저 붙이고 sanitize (사진·글 순서)
              __html: sanitizePostHtml(moveImagesToTopInPostHtml(post.content)),
            }}
          />
        ) : (
          post.content.split("\n").map((line, i) => (
            <p key={i}>{line || " "}</p>
          ))
        )}
      </div>

      {/*
       * 커뮤니티 상세(community/[id])와 동일: 왼쪽 목록, 오른쪽은
       * 갈색 수정하기 → 붉은 삭제하기(순서·비주얼·nestDetailActionRow 정렬 통일)
       */}
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

      {/* 삭제 확인 모달 */}
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

      {/* 대댓글 모달 */}
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
