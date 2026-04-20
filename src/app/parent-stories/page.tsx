import type { Metadata } from "next";
import Link from "next/link";
import { ContentWriteCta } from "@/components/ContentWriteCta";
import { contentTopicPageInfo } from "@/lib/contentTopic";
import styles from "../contentPage.module.css";

export const metadata: Metadata = {
  title: "부모 이야기",
  description: "육아를 하며 겪는 감정·관계에 대한 부드러운 안내",
};

/** 커뮤니티·정서 지원으로 이어갈 수 있는 부모 관점 콘텐츠 페이지 */
export default function ParentStoriesPage() {
  return (
    <main className={styles.contentPage}>
      <h1 className={styles.contentTitle}>부모 이야기</h1>
      <p className={styles.contentLead}>
        완벽한 부모는 없어요. 지치거나 불안할 때는 혼자 참지 말고 이야기 해봐요
      </p>
      <div className={styles.contentLocalWriteRow}>
        <Link
          href={contentTopicPageInfo.parentStories.writePath}
          className={styles.contentWriteLink}
        >
          글쓰기
        </Link>
      </div>
    </main>
  );
}
