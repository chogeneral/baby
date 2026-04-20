"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getChildAgeStageFromBirthYears,
  type ChildAgeStage,
} from "@/lib/childAgeStage";
import type { LoginSessionPayload } from "@/lib/loginSession";
import { readLoginSession } from "@/lib/loginSession";
import styles from "@/app/home.module.css";

const menuItems = [
  {
    href: "/newborn-care",
    title: "신생아 관리",
    desc: "만 1세 이하(연도 기준), 수유·수면·목욕",
    stageMatch: "newborn" as const,
  },
  {
    href: "/development",
    title: "발달",
    desc: "운동·언어·사회성",
    stageMatch: null,
  },
  {
    href: "/parenting-supplies",
    title: "육아용품",
    desc: "이동·수유·위생용품 안내",
    stageMatch: null,
  },
  {
    href: "/parent-stories",
    title: "부모 이야기",
    desc: "정서·관계·번아웃",
    stageMatch: null,
  },
];

function highlightClassForCard(
  stage: ChildAgeStage,
  cardStage: "newborn" | null,
): string {
  if (!cardStage) return "";
  if (stage === "unknown" || stage === "older") return "";
  if (stage === "newborn" && cardStage === "newborn") {
    return styles.mainCardHighlight;
  }
  return "";
}

export function HomeMain() {
  const [session, setSession] = useState<LoginSessionPayload | null>(null);

  useEffect(() => {
    setSession(readLoginSession());
  }, []);

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
      <div className={styles.homeInnerWide}>
        <h1 className={styles.homeTitle}>육아도사</h1>
        <p className={styles.homeLead}>
          아이 연령에 맞는 정보를 모았어요. 로그인하면 첫째 기준으로 안내 메시지를
          바꿔 드려요.
        </p>

        {!session ? (
          <div className={styles.homeActions}>
            <Link className={styles.homePrimaryLink} href="/login">
              로그인
            </Link>
            <p className={styles.homeSignupHint}>
              계정이 없으시면 회원가입을 이용해 주세요.
            </p>
            <Link className={styles.homeSignupButton} href="/signup">
              회원가입
            </Link>
          </div>
        ) : (
          <p className={styles.homeLoggedInHint}>
            <strong>{displayName}</strong>님, 환영해요.{" "}
            <Link href="/mypage" className={styles.homeInlineLink}>
              마이페이지
            </Link>
            에서 대표 연도를 맞출 수 있어요.
          </p>
        )}

        {bannerMessage ? (
          <div className={styles.homeBanner} role="status">
            {bannerMessage}
          </div>
        ) : null}

        <h2 className={styles.homeSectionTitle}>콘텐츠 바로가기</h2>
        <ul className={styles.mainCardGrid}>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.mainCard} ${highlightClassForCard(
                  stage,
                  item.stageMatch,
                )}`}
              >
                <span className={styles.mainCardTitle}>{item.title}</span>
                <span className={styles.mainCardDesc}>{item.desc}</span>
              </Link>
            </li>
          ))}
        </ul>

       
      </div>
    </div>
  );
}
