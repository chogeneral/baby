"use client";

import { useLayoutEffect, useEffect } from "react";
import { usePathname } from "next/navigation";

/** 측정 전·nav 없을 때 `boardRichTextEditor` 툴바 `top` 기본값 — 대략 단일 행 GNB(6rem 근처) */
const defaultHeaderOffsetPx = 96;

/**
 * `<nav id="siteNavbar">` 의 실제 높이를 재서 `document.documentElement` 의
 * `--siteHeaderToolbarOffset` 에 px 로 넣는다.
 * 리치 텍스트 툴바는 `position: sticky; top: var(--siteHeaderToolbarOffset)` 를 쓰므로,
 * 로그인 후 패턴 요약 줄처럼 헤더가 두 줄로 늘어나도 툴바가 GNB 바로 아래에 걸리도록 맞춘다.
 * ResizeObserver 로 DOM 높이 변화(아이 나이 라벨 로드 등)에도 동기화한다.
 */
function applySiteHeaderToolbarOffset() {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  const nav = document.getElementById("siteNavbar");
  if (!nav) {
    root.style.setProperty("--siteHeaderToolbarOffset", `${defaultHeaderOffsetPx}px`);
    return;
  }
  const h = Math.ceil(nav.getBoundingClientRect().height);
  /* 비정상적으로 작은 값 방지(폰트 로드 전 순간 등) */
  root.style.setProperty("--siteHeaderToolbarOffset", `${Math.max(h, 48)}px`);
}

export function SiteHeaderInset() {
  const pathname = usePathname();

  /* 다른 페이지로 가면 네비 구성이 달라질 수 있어 경로마다 한 번 맞춘다 */
  useLayoutEffect(() => {
    applySiteHeaderToolbarOffset();
  }, [pathname]);

  useEffect(() => {
    applySiteHeaderToolbarOffset();
    const nav = document.getElementById("siteNavbar");
    if (!nav) {
      return;
    }
    const ro = new ResizeObserver(() => applySiteHeaderToolbarOffset());
    ro.observe(nav);
    window.addEventListener("resize", applySiteHeaderToolbarOffset);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", applySiteHeaderToolbarOffset);
    };
  }, []);

  return null;
}
