import Link from "next/link";
import styles from "@/app/contentPage.module.css";
import { communityBoardTitle } from "@/lib/communityBoard";

/**
 * 안내·발달 등 정적 페이지에서 연령별 게시판 글쓰기로 이어 준다.
 * 실제로 보이는 방(영아·토들러·유아)은 마이페이지 대표 출생 연도에 따라 정해진다.
 */
export function ContentWriteCta() {
  return (
    <div className={styles.contentWriteBox}>
      <p className={styles.contentWriteText}>
        같은 고민이나 경험을 나누고 싶다면{" "}
        <strong>연령별 게시판「{communityBoardTitle}」</strong>에 글을 남겨 보세요. 대표 아이
        나이에 따라{" "}
        <strong>영아방(1살까지)·토들러방(2살까지)·유아방(3~5살)</strong>이 달라져요.
      </p>
      <Link href="/community/write" className={styles.contentWriteLink}>
        글쓰기
      </Link>
    </div>
  );
}
