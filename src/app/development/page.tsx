import type { Metadata } from "next";
import Link from "next/link";
import { ContentWriteCta } from "@/components/ContentWriteCta";
import { contentTopicPageInfo } from "@/lib/contentTopic";
import styles from "../contentPage.module.css";

export const metadata: Metadata = {
  title: "발달",
  description: "대·소근육, 언어, 사회성 등 발달에 대한 개요",
};

/** 발달 영역별로 부모가 관찰할 수 있는 포인트를 담은 페이지 */
export default function DevelopmentPage() {
  return (
    <main className={styles.contentPage}>
      <h1 className={styles.contentTitle}>발달</h1>
      <p className={styles.contentLead}>
        우리 아이의 시간은 우리와 다르게 흐릅니다. 조금 느려도 괜찮아요, 함께
        걷는 법에 대해 이야기 해봐요
      </p>
      <div className={styles.contentLocalWriteRow}>
        <Link
          href={contentTopicPageInfo.development.writePath}
          className={styles.contentWriteLink}
        >
          글쓰기
        </Link>
      </div>
    </main>
  );
}
