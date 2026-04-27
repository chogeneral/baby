"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "@/app/home.module.css";
import { contentTopicDetailPath } from "@/lib/contentTopic";
import type { HomeLatestPostPreview } from "@/lib/homeLatestPosts";

/**
 * 메인 랜딩 — 히어로 아래 2×2 격자: 1행 아기이야기·부모이야기, 2행 꼬꼬마·정보(데스크톱 `grid` 2열).
 * `latest` 는 서버 `page.tsx` 에서 Supabase 를 읽어 내려주므로 클라이언트에서 다시 fetch 하지 않는다.
 */
const heroImageSrc = "/hero-baby-summer.png";

type HomeMainProps = {
  latest: {
    babyStory: HomeLatestPostPreview[];
    kokkoma: HomeLatestPostPreview[];
    info: HomeLatestPostPreview[];
    parentStories: HomeLatestPostPreview[];
  };
};

/**
 * 한 섹션(아기이야기 / 부모이야기 / 꼬꼬마 / 정보)의 제목·목록·빈 상태를 동일한 마크업으로 그린다.
 * `hrefForId` 는 게시판 종류마다 상세 URL 규칙이 달라서(id 앞 경로만 다름) 부모에서 넘긴다.
 * `showAuthor` 가 true 이면 `authorLabel` 을 **날짜 왼쪽**에만 닉네임으로 보인다(‘글쓴이’ 접두어 없음).
 * (참고) 컴포넌트 식별자는 React 가 소문자를 DOM 태그로 오해하지 않게 PascalCase 를 쓴다.
 */
function HomeLatestSectionBlock(props: {
  title: string;
  items: HomeLatestPostPreview[];
  hrefForId: (id: string) => string;
  showAuthor?: boolean;
}) {
  const { title, items, hrefForId, showAuthor = false } = props;
  // `id` / `aria-labelledby` 에 쓰기 위한 토큰 — 제목이 한글이라 CSS 선택자/중복 id 를 피하려고 slug 를 붙인다.
  const headingId = `homeLatest-${title.replace(/\s+/g, "-")}`;

  return (
    <section className={styles.homeLatestCard} aria-labelledby={headingId}>
      <div className={styles.homeLatestCardHeader}>
        <h2 id={headingId} className={styles.homeLatestCardTitle}>
          {title}
        </h2>
      </div>
      <ul className={styles.homeLatestList}>
        {items.length === 0 ? (
          <li className={styles.homeLatestEmpty}>아직 등록된 글이 없어요.</li>
        ) : (
          items.map((post) => (
            <li key={post.id} className={styles.homeLatestItem}>
              <Link
                href={hrefForId(post.id)}
                className={
                  showAuthor
                    ? `${styles.homeLatestItemLink} ${styles.homeLatestItemLinkWithAuthor}`
                    : styles.homeLatestItemLink
                }
              >
                <div className={styles.homeLatestItemBody}>
                  <span className={styles.homeLatestItemTitle}>{post.title}</span>
                </div>
                <div className={styles.homeLatestItemMeta}>
                  {showAuthor && post.authorLabel != null ? (
                    <span className={styles.homeLatestItemAuthor} aria-label={`작성자 ${post.authorLabel}`}>
                      {post.authorLabel}
                    </span>
                  ) : null}
                  <time className={styles.homeLatestItemDate} dateTime={post.dateLabel}>
                    {post.dateLabel}
                  </time>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function HomeMain({ latest }: HomeMainProps) {
  return (
    <div className={styles.homePage}>
      <section className={styles.heroSection} aria-labelledby="homeHeroTitle">
        <div className={`${styles.homeContainer} ${styles.heroGrid}`}>
          <div>
            <h1 id="homeHeroTitle" className={styles.heroTitle}>
              완벽한 부모보다 행복한 부모가 되도록{" "}
              <span className={styles.heroAccent}>오늘보다 나은 내일을 응원합니다.</span>
            </h1>
          </div>

          <div className={styles.heroImageColumn}>
            <div className={styles.heroImageFrame}>
              <Image
                src={heroImageSrc}
                alt="초록색 수영용 튜브에 누워 선글라스를 쓰고 여유롭게 있는 아기"
                fill
                className={styles.heroImage}
                sizes="(max-width: 900px) 100vw, 42vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.homeLatestSection} aria-label="최신 글">
        <div className={`${styles.homeContainer} ${styles.homeLatestInner}`}>
          <div className={styles.homeLatestGrid}>
            <HomeLatestSectionBlock
              title="아기이야기"
              items={latest.babyStory}
              hrefForId={(id) => `/community/${id}`}
              showAuthor
            />
            <HomeLatestSectionBlock
              title="꼬꼬마"
              items={latest.kokkoma}
              hrefForId={(id) => `/community/${id}`}
            />
            <HomeLatestSectionBlock
              title="부모이야기"
              items={latest.parentStories}
              hrefForId={(id) => contentTopicDetailPath("부모이야기", id)}
              showAuthor
            />
            <HomeLatestSectionBlock
              title="정보"
              items={latest.info}
              hrefForId={(id) => contentTopicDetailPath("정보", id)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
