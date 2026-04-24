"use client";

import Link from "next/link";
import React, { useLayoutEffect, useState, useCallback, useRef } from "react";
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
 * 위로 가기(맨 위로 스크롤) — 쉐브론 두 줄로 “위 방향”을 직관적으로 표시하고 연필 아이콘과 동일한 stroke 톤을 맞췄다.
 */
function scrollToTopIcon() {
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
        d="M6 15l6-6 6 6M6 9l6-6 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 우측 하단 퀵 메뉴.
 * 갈색 연필은 항상 **아이기록 입력**(`/record`)로 보낸다. 비로그인이면 `record/page` 가 `/login` 으로 넘기므로
 * 여기서 로그인 여부로 href 를 나누지 않는다(첫 렌더에서 session 미반영으로 `/login` 으로 잘못 가는 것도 방지).
 */
export function RightQuickMenu() {
  const [inlineBottom, setInlineBottom] = useState<string | undefined>(undefined);
  /**
   * `rightQuickMenu.module.css` 의 `bottom` — 인라인을 쓰지 않을 때만 `getComputedStyle` 으로 갱신
   * (인라인이 켜진 뒤에는 computed 가 인라인 값이 되어 기준을 오염시킨다)
   */
  const defaultBottomPxRef = useRef<number | null>(null);
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const inlineBottomRef = useRef<string | undefined>(undefined);
  inlineBottomRef.current = inlineBottom;

  const updateBottomAboveFooter = useCallback(() => {
    const menu = menuWrapperRef.current;
    if (menu && inlineBottomRef.current == null) {
      const raw = getComputedStyle(menu).bottom;
      if (raw && raw !== "auto") {
        const px = parseFloat(raw);
        if (!Number.isNaN(px)) {
          defaultBottomPxRef.current = px;
        }
      }
    }
    const rem =
      parseFloat(
        getComputedStyle(document.documentElement).fontSize || "16",
      ) || 16;
    const cssDefaultBottom = defaultBottomPxRef.current ?? Math.max(rem, 0) + 50;

    // `layout` 의 전역 푸터(`Footer.tsx`)만 대상 — `querySelector` 는 문서 첫 `<footer>` 를 잡아, 나중에 본문 쪽
    // 시맨틱에 `<footer>` 가 생기면 퀵 메뉴 `bottom` 이 엉뚱한 박스 기준으로 잡힌다(아래에 안 ‘내려가’는 느낌).
    const footer = document.getElementById("globalSiteFooter");
    if (!footer) {
      setInlineBottom(undefined);
      return;
    }
    const ft = footer.getBoundingClientRect();
    const h = window.innerHeight;
    if (ft.top < 0 || ft.top >= h) {
      setInlineBottom(undefined);
      return;
    }
    const gapPx = 8;
    const minBottomToClearFooter = h - ft.top + gapPx;
    setInlineBottom(
      minBottomToClearFooter > cssDefaultBottom
        ? `${minBottomToClearFooter}px`
        : undefined,
    );
  }, []);

  useLayoutEffect(() => {
    updateBottomAboveFooter();
    window.addEventListener("scroll", updateBottomAboveFooter, { passive: true });
    window.addEventListener("resize", updateBottomAboveFooter);
    return () => {
      window.removeEventListener("scroll", updateBottomAboveFooter);
      window.removeEventListener("resize", updateBottomAboveFooter);
    };
  }, [updateBottomAboveFooter]);

  const handleScrollToTop = () => {
    // `scroll-behavior: smooth` 가 없는 환경에서도 부드럽게 맞추기 위해 options 사용(지원 시)
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <div
      ref={menuWrapperRef}
      className={styles.rightQuickMenu}
      
      style={
        { position: "fixed"} as React.CSSProperties & { "--qm-bottom"?: string }
      }
      aria-label="빠른 메뉴"
    >
      <Link
        href="/record"
        className={`${styles.rightQuickMenuItem} ${styles.rightQuickMenuItemBrown}`}
        title="아기 기록 입력"
        aria-label="아이기록 입력 — 몸무게·키·일상"
      >
        {pencilIcon()}
      </Link>
      <button
        type="button"
        className={styles.rightQuickMenuItem}
        title="맨 위로"
        aria-label="페이지 맨 위로 이동"
        onClick={handleScrollToTop}
      >
        {scrollToTopIcon()}
      </button>
    </div>
  );
}
