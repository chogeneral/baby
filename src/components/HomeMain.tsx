"use client";

import Image from "next/image";
import styles from "@/app/home.module.css";

/**
 * 메인 랜딩 — 상단 히어로(환영 문구 + 비주얼)만 둔다.
 * (이전의 이번 주 추천·인기 게시판·처음이신가요? 블록은 기획에서 제거됨)
 */

/** Unsplash: 따뜻한 조명의 부모·아이 이미지 — 히어로 우측 대형 비주얼 */
const heroImageSrc =
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=900&q=85&auto=format&fit=crop";

export function HomeMain() {
  return (
    <div className={styles.homePage}>
      <section className={styles.heroSection} aria-labelledby="homeHeroTitle">
        <div className={`${styles.homeContainer} ${styles.heroGrid}`}>
          <div>
            <p className={styles.heroTag}>육아박사에 오신 걸 환영해요</p>
            <h1 id="homeHeroTitle" className={styles.heroTitle}>
              아이와 함께 더 따뜻하게{" "}
              <span className={styles.heroAccent}>성장해요.</span>
            </h1>
          </div>

          <div className={styles.heroImageColumn}>
            <div className={styles.heroImageFrame}>
              <Image
                src={heroImageSrc}
                alt="부모와 아이가 함께 있는 따뜻한 장면"
                fill
                className={styles.heroImage}
                sizes="(max-width: 900px) 100vw, 42vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
