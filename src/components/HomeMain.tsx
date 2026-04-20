"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getChildAgeStageFromBirthYears } from "@/lib/childAgeStage";
import type { LoginSessionPayload } from "@/lib/loginSession";
import { readLoginSession } from "@/lib/loginSession";
import styles from "@/app/home.module.css";

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

        {session && (
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
      </div>
    </div>
  );
}
