"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getChildAgeStageFromBirthYears } from "@/lib/childAgeStage";
import type { LoginSessionPayload } from "@/lib/loginSession";
import { readLoginSession } from "@/lib/loginSession";
import styles from "@/app/home.module.css";

/** Unsplash: 따뜻한 조명의 부모·아이 이미지 — 히어로 우측 대형 비주얼 */
const heroImageSrc =
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=900&q=85&auto=format&fit=crop";

/** Weekly Best 큰 카드 — 이유식/영양 톤의 상단 다운 푸드 사진 */
const weeklyFeatureSrc =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80&auto=format&fit=crop";

/** 작은 아바타 겹침용 — 커뮤니티 활동감을 주는 스톡 초상 */
const avatarA =
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&auto=format";
const avatarB =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&auto=format";
const avatarC =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&auto=format";

/** 트렌딩 보드 카드 상단 이미지 — 각각 다른 분위기로 3열 그리드 시각적 리듬 */
const trendingSrc = [
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=640&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=640&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=640&q=80&auto=format&fit=crop",
] as const;

export function HomeMain() {
  /**
   * effect 안에서 setState를 쓰지 않기 위해 초기값 함수로 sessionStorage를 읽는다.
   * 서버에서는 window가 없으므로 null로 두고, 클라이언트 첫 렌더에서만 실제 세션을 넣는다.
   */
  const [session] = useState<LoginSessionPayload | null>(() =>
    typeof window === "undefined" ? null : readLoginSession(),
  );

  const stage = getChildAgeStageFromBirthYears(session?.childBirthYears);
  const displayName =
    session?.nickname?.trim() || session?.email?.split("@")[0] || "";

  let bannerMessage: string | null = null;
  if (session) {
    if (stage === "newborn") {
      bannerMessage =
        `${displayName}님, 만 1세 이하 구간이에요. 신생아 관리 정보를 먼저 살펴보세요.`;
    } else if (stage === "older") {
      bannerMessage = `${displayName}님, 발달·활동·부모 이야기도 함께 둘러보세요.`;
    } else {
      bannerMessage =
        `${displayName}님, 마이페이지에서 아이 대표 출생 연도를 설정하면 맞춤 안내가 정확해져요.`;
    }
  }

  return (
    <div className={styles.homePage}>
      <section className={styles.heroSection} aria-labelledby="homeHeroTitle">
        <div className={`${styles.homeContainer} ${styles.heroGrid}`}>
          <div>
            <p className={styles.heroTag}>육아도사에 오신 걸 환영해요</p>
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

      <section className={styles.weeklyBestSection} aria-labelledby="weeklyBestTitle">
        <div className={styles.homeContainer}>
          <div className={styles.sectionHeaderRow}>
            <h2 id="weeklyBestTitle" className={styles.sectionTitle}>
              이번 주 추천
            </h2>
            <Link href="/community/kokkoma" className={styles.sectionLink}>
              전체 보기
              <span aria-hidden> →</span>
            </Link>
          </div>

          <div className={styles.weeklyBestGrid}>
            <Link
              href="/newborn-care"
              className={`${styles.weeklyCard} ${styles.weeklyCardFeature}`}
            >
              <Image
                src={weeklyFeatureSrc}
                alt=""
                fill
                className={styles.weeklyCardFeatureImage}
                sizes="(max-width: 900px) 100vw, 38vw"
              />
              <div className={styles.weeklyCardFeatureOverlay}>
                <span className={styles.weeklyTag}>영양</span>
                <p className={styles.weeklyCardTitleLight}>
                  이유식 시작, 한 끼씩 천천히
                </p>
                <div className={styles.weeklyCardMeta}>
                  <span>♥ 128</span>
                  <span>댓글 24</span>
                </div>
              </div>
            </Link>

            <Link
              href="/parent-stories"
              className={`${styles.weeklyCard} ${styles.weeklyCardArticle}`}
            >
              <span className={styles.weeklyBadge}>멤버 추천</span>
              <p className={styles.weeklyCardTitleDark}>
                첫 돌 전후, 부모가 나눈 솔직한 이야기
              </p>
              <div className={styles.weeklyAvatars} aria-hidden>
                <Image
                  src={avatarA}
                  alt=""
                  width={32}
                  height={32}
                  className={styles.weeklyAvatar}
                />
                <Image
                  src={avatarB}
                  alt=""
                  width={32}
                  height={32}
                  className={styles.weeklyAvatar}
                />
                <Image
                  src={avatarC}
                  alt=""
                  width={32}
                  height={32}
                  className={styles.weeklyAvatar}
                />
              </div>
            </Link>

            <Link
              href="/development"
              className={`${styles.weeklyCard} ${styles.weeklyCardSmall}`}
            >
              <span className={styles.weeklySmallIcon} aria-hidden>
                🧩
              </span>
              <p className={styles.weeklySmallText}>놀이로 배우는 발달</p>
            </Link>

            <div className={`${styles.weeklyCard} ${styles.weeklyCardQuote}`}>
              <span className={styles.weeklyQuoteMark} aria-hidden>
                “
              </span>
              <p className={styles.weeklyQuoteText}>
                오늘의 작은 기록이 내일의 든든한 추억이에요.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.trendingSection} aria-labelledby="trendingTitle">
        <div className={styles.homeContainer}>
          <div className={styles.sectionHeaderRow}>
            <h2 id="trendingTitle" className={styles.sectionTitle}>
              인기 게시판
            </h2>
            <Link href="/community" className={styles.sectionLink}>
              더 보기
              <span aria-hidden> →</span>
            </Link>
          </div>

          <div className={styles.trendingGrid}>
            <Link href="/community/kokkoma" className={styles.trendingCard}>
              <div className={styles.trendingImageWrap}>
                <Image
                  src={trendingSrc[0]}
                  alt=""
                  fill
                  className={styles.trendingImage}
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className={styles.trendingBody}>
                <div className={styles.trendingMetaRow}>
                  <span className={styles.trendingHash}>#꼬꼬마익명</span>
                  <span>오늘도 활발해요</span>
                </div>
                <p className={styles.trendingCardTitle}>꼬꼬마(익명)</p>
                <p className={styles.trendingCardDesc}>
                  익명으로 마음 편히 질문하고 위로받는 공간이에요.
                </p>
              </div>
            </Link>

            <Link href="/community/toddler" className={styles.trendingCard}>
              <div className={styles.trendingImageWrap}>
                <Image
                  src={trendingSrc[1]}
                  alt=""
                  fill
                  className={styles.trendingImage}
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className={styles.trendingBody}>
                <div className={styles.trendingMetaRow}>
                  <span className={styles.trendingHash}>#토들러일상</span>
                  <span>2살 맞춤</span>
                </div>
                <p className={styles.trendingCardTitle}>토들러방</p>
                <p className={styles.trendingCardDesc}>
                  걸음마·언어 폭발기, 같은 시기 부모들과 나눠요.
                </p>
              </div>
            </Link>

            <Link href="/community/young-infant" className={styles.trendingCard}>
              <div className={styles.trendingImageWrap}>
                <Image
                  src={trendingSrc[2]}
                  alt=""
                  fill
                  className={styles.trendingImage}
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className={styles.trendingBody}>
                <div className={styles.trendingMetaRow}>
                  <span className={styles.trendingHash}>#영아케어</span>
                  <span>1살 이하</span>
                </div>
                <p className={styles.trendingCardTitle}>영아방</p>
                <p className={styles.trendingCardDesc}>
                  수면·수유·건강 고민을 가볍게 물어보세요.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section
        className={styles.nestCtaSection}
        aria-labelledby="nestCtaTitle"
      >
        <div className={`${styles.homeContainer} ${styles.nestCtaInner}`}>
          <div className={styles.nestLogoRow}>
            <span aria-hidden>🌿</span>
            <p id="nestCtaTitle" className={styles.nestLogoText}>
              처음이신가요?
            </p>
          </div>
          <div className={styles.nestCtaGrid}>
            <Link href="/signup" className={styles.nestCtaCard}>
              <span className={styles.nestCtaIcon} aria-hidden>
                👋
              </span>
              <span className={styles.nestCtaLabel}>가입하고 소개하기</span>
            </Link>
            <Link href="/community" className={styles.nestCtaCard}>
              <span className={styles.nestCtaIcon} aria-hidden>
                📖
              </span>
              <span className={styles.nestCtaLabel}>커뮤니티 둘러보기</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.siteFooter}>
        <div className={styles.homeContainer}>
          <p className={styles.siteFooterBrand}>육아도사</p>
          <ul className={styles.siteFooterLinks}>
            <li>
              <Link href="/login">로그인</Link>
            </li>
            <li>
              <Link href="/signup">회원가입</Link>
            </li>
            <li>
              <Link href="/mypage">마이페이지</Link>
            </li>
            <li>
              <Link href="/development">발달</Link>
            </li>
            <li>
              <Link href="/parenting-supplies">육아용품</Link>
            </li>
          </ul>
          <p className={styles.siteFooterCopy}>
            © {new Date().getFullYear()} 육아도사. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
