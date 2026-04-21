import type { Metadata } from "next";
import Link from "next/link";
import { contentTopicPageInfo } from "@/lib/contentTopic";
import styles from "../contentPage.module.css";

export const metadata: Metadata = {
  title: "육아용품",
  description: "유모차, 카시트, 젖병 등 육아용품 선택 시 참고 포인트",
};

/**
 * 메뉴명 '용풍' 요청을 일반적으로 쓰는 '육아용품' 카테고리로 구성했다.
 * 실제 구매 전에는 최신 안전 기준·리콜 정보를 꼭 확인해 주세요.
 */
export default function ParentingSuppliesPage() {
  return (
    <main className={styles.contentPage}>
      <p className={styles.contentTag}>콘텐츠</p>
      <h1 className={styles.contentTitle}>육아용품</h1>
      <p className={styles.contentLead}>
        초보 부모의 서툰 하루를 완벽하게 채워줄 필수 육아 아이템에 대해서 이야기 해봐요
      </p>
      <div className={styles.contentLocalWriteRow}>
        <Link
          href={contentTopicPageInfo.parentingSupplies.writePath}
          className={styles.contentWriteLink}
        >
          글쓰기
        </Link>
      </div>
    </main>
  );
}
