"use client";

import styles from "@/app/contentPage.module.css";

type Props = {
  /** 본문 HTML 에 data URL 이미지가 있으면 true — 글쓰기 하단 1장·인라인 모두 감지 */
  hasPhoto: boolean;
};

/**
 * 발달·부모이야기·꼬꼬마 목록 테이블의 ‘사진’ 칸용 작은 액자 아이콘.
 * 첨부가 없으면 같은 너비로 대시만 두어 열이 흔들리지 않게 한다.
 */
export function PostListPhotoBadge({ hasPhoto }: Props) {
  if (!hasPhoto) {
    return <span className={styles.postTablePhotoPlaceholder}>—</span>;
  }
  return (
    <span
      className={styles.postTablePhotoIconWrap}
      title="사진 첨부"
      role="img"
      aria-label="사진 첨부"
    >
      <svg className={styles.postTablePhotoSvg} viewBox="0 0 40 36" aria-hidden>
        <rect
          x="2"
          y="2"
          width="36"
          height="28"
          rx="5"
          ry="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M6 26 L14 16 L20 22 L28 12 L34 26 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <circle cx="29" cy="9" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    </span>
  );
}
