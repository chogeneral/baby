"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { ContentTopicKind } from "@/lib/contentTopic";
import {
  contentTopicPageInfo,
  isContentTopicWriteAllowedEmail,
} from "@/lib/contentTopic";
import { readLoginSession } from "@/lib/loginSession";
import styles from "@/app/contentPage.module.css";
import { PostListPhotoBadge } from "@/components/PostListPhotoBadge";
import { PostStackListMobile } from "@/components/PostStackListMobile";
import { firstDataImageSrcFromPostHtml } from "@/lib/postHtmlUtils";

const PAGE_SIZE = 10;

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  viewCount?: number;
  commentCount?: number;
  /** 발달·부모이야기 목록/모바일 스택에서만 표시 — API 가 내려주는 닉네임 */
  authorNickname?: string;
};

type Props = {
  topic: ContentTopicKind;
  /** 게시판 소개 아래·목록 위에 넣을 블록(예: 실시간 위치 주변 1km 위젯) */
  children?: ReactNode;
};

export function ContentTopicBoard({ topic, children }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  /** 정보 게시판: 관리자 전용 / 발달·부모이야기: 로그인 여부와 무관하게 항상 표시 */
  const [showAdminWriteLink, setShowAdminWriteLink] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const info = contentTopicPageInfo[topic];

  useEffect(() => {
    const session = readLoginSession();
    setIsLoggedIn(!!session);
    setShowAdminWriteLink(isContentTopicWriteAllowedEmail(session?.email));
  }, [topic]);

  useEffect(() => {
    setPage(1);
    fetch(`/api/content-topic-posts?topic=${encodeURIComponent(topic)}`)
      .then((r) => r.json())
      .then((data) => setPosts(data as Post[]))
      .finally(() => setIsLoading(false));
  }, [topic]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pagePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* 정보 게시판은 기존 열 구성을 유지하고, 부모이야기만 ‘글쓴이’ 열·모바일 닉네임을 보여 준다. */
  const showAuthorColumn = topic === "부모이야기";

  const stackEntries = pagePosts.map((post) => {
    const hasPhoto = !!firstDataImageSrcFromPostHtml(post.content ?? "");
    return {
      id: post.id,
      href: `${info.backPath}/${post.id}`,
      title: post.title,
      createdAt: post.createdAt,
      hasPhoto,
      authorName: showAuthorColumn
        ? post.authorNickname?.trim() || "—"
        : undefined,
    };
  });

  return (
    <main className={styles.contentPage}>
      <h1 className={styles.contentTitle} style={{ marginBottom: "0.5rem" }}>{info.title}</h1>
      <p className={styles.contentSubtext} style={{ color: "#6b6560", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        {info.subtext}
      </p>

      {children}

      <div className={`${styles.postTableWrap} ${styles.postTableOnlyDesktop}`}>
        <table className={styles.postTable}>
          <colgroup>
            <col style={{ width: "3.5rem" }} />
            <col />
            {showAuthorColumn ? <col style={{ width: "5.25rem" }} /> : null}
            <col style={{ width: "6.5rem" }} />
            <col style={{ width: "3.5rem" }} />
            <col style={{ width: "2.75rem" }} />
            <col style={{ width: "4.5rem" }} />
          </colgroup>
          <thead>
            <tr>
              <th className={styles.postTableThCenter}>번호</th>
              <th className={styles.postTableThLeft}>제목</th>
              {showAuthorColumn ? (
                <th className={styles.postTableThCenter}>글쓴이</th>
              ) : null}
              <th className={styles.postTableThCenter}>날짜</th>
              <th className={styles.postTableThCenter}>댓글</th>
              <th className={styles.postTableThCenter}>사진</th>
              <th className={styles.postTableThCenter}>조회</th>
            </tr>
          </thead>
          <tbody>
            {pagePosts.map((post, i) => {
              /* 목록 API 가 내려주는 content 로 data URL 이미지 여부만 본다 — 글쓰기 하단 1장·본문 삽입 모두 동일 */
              const rowHasPhoto = !!firstDataImageSrcFromPostHtml(post.content ?? "");
              return (
              <tr key={post.id} className={styles.postTableRow}>
                <td className={styles.postTableTdCenter}>
                  {posts.length - ((page - 1) * PAGE_SIZE + i)}
                </td>
                <td className={styles.postTableTdLeft}>
                  <Link href={`${info.backPath}/${post.id}`} className={styles.postTableLink}>
                    {post.title}
                  </Link>
                </td>
                {showAuthorColumn ? (
                  <td className={styles.postTableTdCenter}>
                    {post.authorNickname?.trim() || "—"}
                  </td>
                ) : null}
                <td className={styles.postTableTdCenter}>{post.createdAt.slice(0, 10)}</td>
                <td className={styles.postTableTdCenter}>{post.commentCount ?? 0}</td>
                <td className={styles.postTableTdCenter}>
                  <PostListPhotoBadge hasPhoto={rowHasPhoto} />
                </td>
                <td className={styles.postTableTdCenter}>{post.viewCount ?? 0}</td>
              </tr>
            );
            })}
            {!isLoading && posts.length === 0 && (
              <tr>
                <td
                  colSpan={showAuthorColumn ? 7 : 6}
                  className={styles.postTableEmpty}
                >
                  아직 작성된 글이 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PostStackListMobile
        entries={stackEntries}
        isLoading={isLoading}
        emptyMessage="아직 작성된 글이 없어요."
      />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
          >
            ›
          </button>
        </div>
      )}

      <div className={styles.detailActions}>
        <Link href="/" className={styles.detailBtnSecondary}>
          ← 목록
        </Link>
        {topic === "부모이야기" ? (
          <Link
            href={isLoggedIn ? info.writePath : "/login"}
            className={styles.contentWriteLink}
          >
            글쓰기
          </Link>
        ) : showAdminWriteLink ? (
          <Link href={info.writePath} className={styles.contentWriteLink}>
            글쓰기
          </Link>
        ) : null}
      </div>
    </main>
  );
}
