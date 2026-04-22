"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ContentTopicKind } from "@/lib/contentTopic";
import { contentTopicPageInfo } from "@/lib/contentTopic";
import styles from "@/app/contentPage.module.css";
import { PostStackListMobile } from "@/components/PostStackListMobile";

const PAGE_SIZE = 10;

type Post = {
  id: string;
  title: string;
  authorNickname: string;
  createdAt: string;
  photoDataUrl?: string;
  viewCount?: number;
  commentCount?: number;
};

type Props = { topic: ContentTopicKind };

function PhotoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="사진 있음"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function ContentTopicBoard({ topic }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const info = contentTopicPageInfo[topic];

  useEffect(() => {
    setPage(1);
    fetch(`/api/content-topic-posts?topic=${topic}`)
      .then((r) => r.json())
      .then((data) => setPosts(data as Post[]))
      .finally(() => setIsLoading(false));
  }, [topic]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pagePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stackEntries = pagePosts.map((post) => ({
    id: post.id,
    href: `${info.backPath}/${post.id}`,
    title: post.title,
    createdAt: post.createdAt,
  }));

  return (
    <main className={styles.contentPage}>
      <h1 className={styles.contentTitle} style={{ marginBottom: "0.5rem" }}>{info.title}</h1>
      <p className={styles.contentSubtext} style={{ color: "#6b6560", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        {info.subtext}
      </p>

      <div className={`${styles.postTableWrap} ${styles.postTableOnlyDesktop}`}>
        <table className={styles.postTable}>
          <colgroup>
            <col style={{ width: "3.5rem" }} />
            <col />
            <col style={{ width: "6rem" }} />
            <col style={{ width: "2.5rem" }} />
            <col style={{ width: "6.5rem" }} />
            <col style={{ width: "3.5rem" }} />
            <col style={{ width: "4.5rem" }} />
          </colgroup>
          <thead>
            <tr>
              <th className={styles.postTableThCenter}>번호</th>
              <th className={styles.postTableThLeft}>제목</th>
              <th className={styles.postTableThCenter}>작성자</th>
              <th className={styles.postTableThCenter}>사진</th>
              <th className={styles.postTableThCenter}>날짜</th>
              <th className={styles.postTableThCenter}>댓글</th>
              <th className={styles.postTableThCenter}>조회</th>
            </tr>
          </thead>
          <tbody>
            {pagePosts.map((post, i) => (
              <tr key={post.id} className={styles.postTableRow}>
                <td className={styles.postTableTdCenter}>
                  {posts.length - ((page - 1) * PAGE_SIZE + i)}
                </td>
                <td className={styles.postTableTdLeft}>
                  <Link href={`${info.backPath}/${post.id}`} className={styles.postTableLink}>
                    {post.title}
                  </Link>
                </td>
                <td className={styles.postTableTdCenter}>{post.authorNickname || "익명"}</td>
                <td className={styles.postTableTdCenter}>
                  {post.photoDataUrl && (
                    <span className={styles.postTablePhotoIcon}>
                      <PhotoIcon />
                    </span>
                  )}
                </td>
                <td className={styles.postTableTdCenter}>{post.createdAt.slice(0, 10)}</td>
                <td className={styles.postTableTdCenter}>{post.commentCount ?? 0}</td>
                <td className={styles.postTableTdCenter}>{post.viewCount ?? 0}</td>
              </tr>
            ))}
            {!isLoading && posts.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.postTableEmpty}>
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
        <Link href={info.writePath} className={styles.contentWriteLink}>
          글쓰기
        </Link>
      </div>
    </main>
  );
}
