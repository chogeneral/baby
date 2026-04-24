"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/app/contentPage.module.css";
import { communityRoomLabels } from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";
import { PostListPhotoBadge } from "@/components/PostListPhotoBadge";
import { PostStackListMobile } from "@/components/PostStackListMobile";
import { firstDataImageSrcFromPostHtml } from "@/lib/postHtmlUtils";

const PAGE_SIZE = 10;

type Post = {
  id: string;
  title: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  prefix?: string;
  viewCount?: number;
  commentCount?: number;
};

export function BabyStoryBoard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const session = readLoginSession();
    setIsLoggedIn(!!session);
    fetch("/api/posts?boardKind=babyStory")
      .then((r) => r.json())
      .then((data) => setPosts(data as Post[]))
      .finally(() => setIsLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pagePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stackEntries = pagePosts.map((post) => {
    const hasPhoto = !!firstDataImageSrcFromPostHtml(post.content ?? "");
    const titleWithPrefix = post.prefix ? `[${post.prefix}] ${post.title}` : post.title;
    return {
      id: post.id,
      href: `/community/${post.id}`,
      title: titleWithPrefix,
      createdAt: post.createdAt,
      hasPhoto,
      authorName: post.authorNickname?.trim() || "—",
    };
  });

  return (
    <main className={styles.contentPage}>
      <h1 className={styles.contentTitle} style={{ marginBottom: "0.5rem" }}>
        {communityRoomLabels.babyStory.roomName}
      </h1>
      <p className={styles.contentSubtext} style={{ color: "#6b6560", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        {communityRoomLabels.babyStory.ageHint}
      </p>

      <div className={`${styles.postTableWrap} ${styles.postTableOnlyDesktop}`}>
        <table className={styles.postTable}>
          <colgroup>
            <col style={{ width: "3.5rem" }} />
            <col style={{ width: "5rem" }} />
            <col />
            <col style={{ width: "5.25rem" }} />
            <col style={{ width: "6.5rem" }} />
            <col style={{ width: "3.5rem" }} />
            <col style={{ width: "2.75rem" }} />
            <col style={{ width: "4.5rem" }} />
          </colgroup>
          <thead>
            <tr>
              <th className={styles.postTableThCenter}>번호</th>
              <th className={styles.postTableThCenter}>말머리</th>
              <th className={styles.postTableThLeft}>제목</th>
              <th className={styles.postTableThCenter}>글쓴이</th>
              <th className={styles.postTableThCenter}>날짜</th>
              <th className={styles.postTableThCenter}>댓글</th>
              <th className={styles.postTableThCenter}>사진</th>
              <th className={styles.postTableThCenter}>조회</th>
            </tr>
          </thead>
          <tbody>
            {pagePosts.map((post, i) => {
              const rowHasPhoto = !!firstDataImageSrcFromPostHtml(post.content ?? "");
              return (
                <tr key={post.id} className={styles.postTableRow}>
                  <td className={styles.postTableTdCenter}>
                    {posts.length - ((page - 1) * PAGE_SIZE + i)}
                  </td>
                  <td className={styles.postTableTdCenter}>
                    {post.prefix ?? "—"}
                  </td>
                  <td className={styles.postTableTdLeft}>
                    <Link href={`/community/${post.id}`} className={styles.postTableLink}>
                      {post.title}
                    </Link>
                  </td>
                  <td className={styles.postTableTdCenter}>
                    {post.authorNickname?.trim() || "—"}
                  </td>
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
                <td colSpan={8} className={styles.postTableEmpty}>
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
        {isLoggedIn ? (
          <Link href="/community/write" className={styles.contentWriteLink}>
            글쓰기
          </Link>
        ) : (
          <Link href="/login" className={styles.contentWriteLink}>
            글쓰기
          </Link>
        )}
      </div>
    </main>
  );
}
