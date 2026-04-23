"use client";

import Link from "next/link";
import styles from "@/app/contentPage.module.css";
import { PostListPhotoBadge } from "@/components/PostListPhotoBadge";

/**
 * ISO 앞 10자(YYYY-MM-DD)를 모바일에서 보기 쉬운 YYYY.MM.DD 로 바꾼다.
 */
function formatStackDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, ".");
}

export type PostStackListEntry = {
  id: string;
  href: string;
  title: string;
  createdAt: string;
  /** 본문에 첨부 이미지가 있으면 제목 옆에 작은 아이콘 */
  hasPhoto?: boolean;
  /** 발달·부모이야기 등 — 있으면 날짜 앞에 `닉네임 ·` 으로 붙인다. */
  authorName?: string;
};

type PostStackListMobileProps = {
  entries: PostStackListEntry[];
  isLoading: boolean;
  emptyMessage: string;
};

/**
 * 가로 칸이 많은 테이블은 모바일에서 읽기 어렵다.
 * 768px 미만에서만 쓰는 세로 스택(제목 위·날짜 아래, 왼쪽 정렬, 얇은 구분선)이다.
 * 데스크톱은 부모의 postTableOnlyDesktop 로 테이블을 보여 준다.
 */
export function PostStackListMobile({
  entries,
  isLoading,
  emptyMessage,
}: PostStackListMobileProps) {
  if (isLoading) {
    return (
      <div className={styles.postStackListHost} aria-live="polite">
        <p className={styles.postStackListLoading}>불러오는 중…</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={styles.postStackListHost}>
        <p className={styles.postStackListEmpty} role="status">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.postStackListHost}>
      <ul className={styles.postStackList} aria-label="게시글 목록">
        {entries.map((entry) => (
          <li key={entry.id} className={styles.postStackItem}>
            <Link href={entry.href} className={styles.postStackItemLink}>
              <span className={styles.postStackTitleRow}>
                <span className={styles.postStackTitle}>{entry.title}</span>
                {entry.hasPhoto ? <PostListPhotoBadge hasPhoto /> : null}
              </span>
              <span className={styles.postStackDate}>
                {entry.authorName != null && entry.authorName !== "" ? (
                  <>
                    <span className={styles.postStackAuthorName}>{entry.authorName}</span>
                    <span aria-hidden> · </span>
                  </>
                ) : null}
                {formatStackDate(entry.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
