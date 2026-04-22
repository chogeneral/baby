"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/components/communityRoomBoard.module.css";
import { displayCommunityNickname } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  getCommunityRoomFromBirthYears,
  isKokkomaBoard,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";

type Post = {
  id: string;
  title: string;
  content: string;
  authorNickname: string;
  childBirthYear: number;
  createdAt: string;
  prefix?: string;
  photoDataUrl?: string;
  viewCount?: number;
  commentCount?: number;
};

type Props = {
  /** URL로 열린 방 — 대표 연도와 다르면 맞는 방으로 보낸다 */
  roomKind: CommunityRoomKind;
};

export function CommunityRoomBoard({ roomKind }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;
  const kokkomaMode = isKokkomaBoard(roomKind);

  useEffect(() => {
    const session = readLoginSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 세션 유무로 UI·API 분기 전에 동기화한다
    setIsLoggedIn(!!session);

    if (kokkomaMode) {
      const q = new URLSearchParams({ boardKind: roomKind });
      fetch(`/api/posts?${q.toString()}`)
        .then((r) => r.json())
        .then((data) => setPosts(data as Post[]))
        .finally(() => setIsLoading(false));
      return;
    }

    const myRoom = getCommunityRoomFromBirthYears(
      session?.childBirthYears,
      new Date(),
      session?.primaryChildIndex ?? 0,
    );
    if (session && myRoom === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 리다이렉트 직후 로딩 화면 전환용
      setRedirecting(true);
      router.replace("/community");
      return;
    }
    if (session && myRoom && myRoom !== roomKind) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 올바른 연령방으로 보내기 위한 플래그
      setRedirecting(true);
      router.replace(communityRoomPath[myRoom]);
      return;
    }

    const q = new URLSearchParams({ boardKind: roomKind });
    fetch(`/api/posts?${q.toString()}`)
      .then((r) => r.json())
      .then((data) => setPosts(data as Post[]))
      .finally(() => setIsLoading(false));
  }, [roomKind, router, kokkomaMode]);

  const roomLabel = communityRoomLabels[roomKind];
  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const pagedPosts = posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (redirecting) {
    return (
      <main className={styles.boardPage}>
        <div className={styles.boardContainer}>
          <p className={styles.boardMessage}>연령에 맞는 게시판으로 이동 중…</p>
        </div>
      </main>
    );
  }

  const writeHref = kokkomaMode ? "/community/kokkoma/write" : "/community/write";

  return (
    <main className={styles.boardPage}>
      <div className={styles.boardContainer}>
        <header>
          <h1 className={styles.boardTitle}>{roomLabel.roomName}</h1>
          <p className={styles.boardHint}>{roomLabel.ageHint}</p>
        </header>

        {isLoading ? (
          <p className={styles.boardMessage}>불러오는 중…</p>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyHint}>아직 올라온 글이 없어요.</p>
            {!isLoggedIn && (
              <Link href="/login" className={styles.loginLink}>
                로그인 후 글을 작성할 수 있어요 →
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.cardGrid}>
              {pagedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className={styles.postCard}
                >
                  <div className={styles.cardThumb}>
                    {post.photoDataUrl ? (
                      <img
                        src={post.photoDataUrl}
                        alt=""
                        className={styles.cardThumbImg}
                      />
                    ) : (
                      <div className={styles.cardThumbPlaceholder}>
                        <span className={styles.cardPlaceholderText}>no-image</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    {post.prefix && (
                      <span className={styles.cardPrefix}>{post.prefix}</span>
                    )}
                    <p className={styles.cardTitle}>
                      {post.title}
                      {(post.commentCount ?? 0) > 0 && (
                        <span style={{ color: "#5c4033", marginLeft: "0.3rem", fontSize: "0.85em", fontWeight: 600 }}>
                          [{post.commentCount}]
                        </span>
                      )}
                    </p>
                    {post.content && (
                      <p className={styles.cardExcerpt}>
                        {post.content.slice(0, 60)}{post.content.length > 60 ? "…" : ""}
                      </p>
                    )}
                    <div className={styles.cardMeta}>
                      <span>
                        {kokkomaMode ? "익명" : displayCommunityNickname(post.authorNickname)}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span aria-hidden>·</span>
                      <span>👁 {post.viewCount ?? 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                  aria-label="이전 페이지"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ""}`}
                    aria-current={currentPage === page ? "page" : undefined}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                  aria-label="다음 페이지"
                >
                  ›
                </button>
              </div>
            )}

            {isLoggedIn && (
              <div className={styles.boardToolbar}>
                <Link href={writeHref} className={styles.writeButton}>
                  글쓰기
                </Link>
              </div>
            )}
          </>
        )}

        {posts.length === 0 && isLoggedIn && (
          <div className={styles.boardToolbar}>
            <Link href={writeHref} className={styles.writeButton}>
              글쓰기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
