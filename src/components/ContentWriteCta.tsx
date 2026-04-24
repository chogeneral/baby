import Link from "next/link";
import styles from "@/app/contentPage.module.css";
import { communityBoardTitle } from "@/lib/communityBoard";

/**
 * 안내·발달 등 정적 페이지에서 아기이야기 글쓰기로 이어 준다.

 */
export function ContentWriteCta() {
  return (
    <div className={styles.contentWriteBox}>
      <p className={styles.contentWriteText}>
        같은 고민이나 경험을 나누고 싶다면{" "}
        <strong>「{communityBoardTitle}」</strong> 아기이야기에 글을 남겨 보세요. 대표 아이
        정보는 마이페이지에서 설정해요.
      </p>
      <Link href="/community/write" className={styles.contentWriteLink}>
        글쓰기
      </Link>
    </div>
  );
}
