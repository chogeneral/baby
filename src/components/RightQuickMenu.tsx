"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { readLoginSession } from "@/lib/loginSession";
import styles from "@/components/rightQuickMenu.module.css";

/**
 * 연필(글쓰기) — 대각 몸체 + 심만 stroke 로 그려 네비·퀵 메뉴 톤과 맞췄다.
 */
function pencilIcon() {
  return (
    <svg
      className={styles.rightQuickMenuIcon}
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 우측 하단 퀵 메뉴: 로그인 시 아기 성장·일상 기록 페이지(`/record`)로 이동한다.
 * 비로그인이면 로그인 후 다시 누르면 기록으로 갈 수 있게 `/login` 으로 보낸다.
 */
export function RightQuickMenu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage 는 클라이언트에서만 읽는다
    setIsLoggedIn(!!readLoginSession());
  }, []);

  const href = isLoggedIn ? "/record" : "/login";
  const title = "아기 기록";

  return (
    <div className={styles.rightQuickMenu} aria-label="빠른 메뉴">
      <Link
        href={href}
        className={styles.rightQuickMenuItem}
        title={title}
        aria-label="아기 기록 — 몸무게·키·일상 입력"
      >
        {pencilIcon()}
      </Link>
    </div>
  );
}
