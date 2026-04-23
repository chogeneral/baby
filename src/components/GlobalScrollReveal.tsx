"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import styles from "@/components/globalScrollReveal.module.css";

/**
 * 모든 페이지에서 `main`·`section`·`article`·`footer` 를 스크롤에 맞춰 짧게 떠오르듯 드러낸다.
 * `main` 안에 `section` 이 있으면 래퍼 `main` 은 제외해 중복 애니메이션을 막는다.
 * GNB(고정 네비)·퀵메뉴는 선택 대상에 넣지 않는다.
 */
function collectRevealTargets(root: Document): HTMLElement[] {
  const raw = Array.from(root.querySelectorAll<HTMLElement>("main, section, article, footer"));
  return raw.filter((el) => {
    if (el.closest("nav")) return false;
    if (el.tagName === "MAIN" && el.querySelector("section")) return false;
    if (el.tagName === "ARTICLE" && el.closest("section")) return false;
    return true;
  });
}

function syncVisible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const triggerBottom = window.innerHeight * 0.85;
  if (r.top < triggerBottom && r.bottom > 0) {
    el.classList.add(styles.revealed);
  } else {
    el.classList.remove(styles.revealed);
  }
}

/**
 * `layout` 에 한 번만 두고, 경로가 바뀔 때마다 DOM 을 다시 훑는다(클라이언트 전환 대응).
 * 첫 페인트 직전(`useLayoutEffect`)에만 클래스를 붙여 `opacity:0` 깜빡임을 줄인다.
 */
export function GlobalScrollReveal() {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    observerRef.current?.disconnect();
    observerRef.current = null;

    const nodes = collectRevealTargets(document);
    nodes.forEach((el) => {
      el.classList.remove(styles.revealable, styles.revealed);
      el.classList.add(styles.revealable);
    });

    const ob = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add(styles.revealed);
          } else {
            (entry.target as HTMLElement).classList.remove(styles.revealed);
          }
        }
      },
      { root: null, rootMargin: "0px 0px -15% 0px", threshold: 0 },
    );
    observerRef.current = ob;

    requestAnimationFrame(() => {
      for (const el of nodes) {
        syncVisible(el);
        ob.observe(el);
      }
    });

    return () => {
      for (const el of nodes) {
        el.classList.remove(styles.revealable, styles.revealed);
        ob.unobserve(el);
      }
      ob.disconnect();
    };
  }, [pathname]);

  return null;
}
