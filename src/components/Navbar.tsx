"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getNavPrimaryChildAgeLabel } from "@/lib/primaryChildAgeLabel";
import { clearLoginSession, readLoginSession } from "@/lib/loginSession";

function readSessionNickname(): string | null {
  const session = readLoginSession();
  const nick = session?.nickname?.trim();
  return nick || session?.email || null;
}

/** 프로필 원형 아이콘 — 로그인 여부와 무관하게 동일한 실루엣으로 통일 */
function userIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * lazy 초기화로 클라이언트 마운트 시 즉시 sessionStorage에서 읽어
   * 새로고침 시 깜빡임(skeleton → 로그인 → 닉네임)을 방지한다.
   */
  const [nickname, setNickname] = useState<string | null>(null);
  /** session에 있는 기준 아이 datepicker(YYYY-MM-DD)로 둔 나이 — ‘아이기록’ 링크 왼쪽 */
  const [primaryChildAgeLabel, setPrimaryChildAgeLabel] = useState<string | null>(null);
  /**
   * 1024px 미만(lg 미만)에서만 쓰는 풀스크린형 사이드 메뉴 — 햄버거로 열고,
   * 배경 딤·Escape·경로 이동 시 닫혀 뒤 콘텐츠와 충돌을 줄인다.
   */
  /**
   * 오버레이 DOM 유지 — 닫힐 때는 `isSideMenuPanelEnter` 만 먼저 끄고
   * 전이 종료(또는 백업 타이머) 후 `false` 로 내려 exit 애니메이션이 끊기지 않게 한다.
   */
  const [isSideMenuMounted, setIsSideMenuMounted] = useState(false);
  /**
   * 패널이 화면 안으로 들어온 상태(열림) — 닫는 중에는 `false` 이고 DOM 은 `isSideMenuMounted` 가 잠시 `true` 유지.
   */
  const [isSideMenuPanelEnter, setIsSideMenuPanelEnter] = useState(false);
  /** `transitionend` 핸들러가 최신 `isSideMenuPanelEnter` 를 보도록(닫힘 직전 렌더와 어긋남 방지) */
  const isSideMenuPanelEnterRef = useRef(false);
  /** `transitionend` 가 안 오는 환경(레이스 등)을 대비한 언마운트 백업 — `duration-300` + 여유 */
  const sideMenuCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  isSideMenuPanelEnterRef.current = isSideMenuPanelEnter;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  /** 패널이 열릴 때 첫 키보드 포커스를 닫기 버튼에 두어 스크린리더·탭 순서를 맞춘다 */
  const sideMenuPanelCloseRef = useRef<HTMLButtonElement>(null);

  /* pathname 변경(로그인·로그아웃 직후 등)에 맞춰 sessionStorage와 네비 라벨을 동기화한다 */
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 클라이언트 네비게이션 후 세션과 경로를 맞추기 위한 동기 읽기
    setNickname(readSessionNickname());
    const s = readLoginSession();
    setPrimaryChildAgeLabel(
      s
        ? getNavPrimaryChildAgeLabel(
            s.childBirthDates,
            s.primaryChildIndex,
            s.childBirthYears,
          )
        : null,
    );
  }, [pathname]);

  /* 세션에 childBirthDates가 없어도 서버(마이/가입 저장)에는 있을 수 있으므로 /api/me 로 보강 — 마이페이지 저장 직후에도 갱신 */
  useEffect(() => {
    if (!nickname) {
      return;
    }
    const s = readLoginSession();
    const email = s?.email;
    if (!email) {
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/me?email=${encodeURIComponent(email)}`,
      );
      if (cancelled || !res.ok) {
        return;
      }
      const me = (await res.json()) as {
        childBirthDates?: string[];
        childBirthYears?: number[];
        childBirthYear?: number;
        primaryChildIndex?: number;
      };
      if (cancelled) {
        return;
      }
      const yearsForAge =
        me.childBirthYears && me.childBirthYears.length > 0
          ? me.childBirthYears
          : me.childBirthYear != null
            ? [me.childBirthYear]
            : undefined;
      setPrimaryChildAgeLabel(
        getNavPrimaryChildAgeLabel(
          me.childBirthDates,
          me.primaryChildIndex,
          yearsForAge,
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [nickname, pathname]);

  function clearSideMenuCloseFallback() {
    if (sideMenuCloseFallbackRef.current) {
      clearTimeout(sideMenuCloseFallbackRef.current);
      sideMenuCloseFallbackRef.current = null;
    }
  }

  const requestCloseSideMenu = useCallback(() => {
    if (!isSideMenuMounted) {
      return;
    }
    setIsSideMenuPanelEnter(false);
    clearSideMenuCloseFallback();
    sideMenuCloseFallbackRef.current = setTimeout(() => {
      setIsSideMenuMounted(false);
      sideMenuCloseFallbackRef.current = null;
    }, 360);
  }, [isSideMenuMounted]);

  const onSideMenuPanelTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) {
        return;
      }
      if (e.propertyName !== "transform") {
        return;
      }
      /* `true` 이면 ‘열림’ 전이 끝 — 언마운트 금지. `false` 이면 ‘닫힘’ 전이 끝 — DOM 제거. */
      if (isSideMenuPanelEnterRef.current) {
        return;
      }
      clearSideMenuCloseFallback();
      setIsSideMenuMounted(false);
    },
    [],
  );

  /* URL 이 바뀌면(사이드 메뉴 링크·외부 이동) 애니메이션 없이 바로 DOM 에서 뺀다(라우트와 동기) */
  useEffect(() => {
    setIsSideMenuMounted(false);
    setIsSideMenuPanelEnter(false);
    clearSideMenuCloseFallback();
  }, [pathname]);

  useEffect(() => {
    if (!isSideMenuMounted) {
      setIsSideMenuPanelEnter(false);
      return;
    }
    setIsSideMenuPanelEnter(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSideMenuPanelEnter(true);
      });
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [isSideMenuMounted]);

  useEffect(() => {
    if (!isSideMenuMounted) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        requestCloseSideMenu();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSideMenuMounted, requestCloseSideMenu]);

  useEffect(() => {
    if (!isSideMenuMounted || !isSideMenuPanelEnter) {
      return;
    }
    /* 열림 전이가 끝난 뒤에만 포커스 — 닫는 중/나가는 애니에는 옮기지 않는다 */
    sideMenuPanelCloseRef.current?.focus();
  }, [isSideMenuMounted, isSideMenuPanelEnter]);

  function handleLogout() {
    clearLoginSession();
    setNickname(null);
    setPrimaryChildAgeLabel(null);
    router.push("/");
    router.refresh();
  }

  const babyStoryIsActive =
    pathname.startsWith("/community") &&
    !pathname.startsWith("/community/kokkoma");

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const navLinkBase =
    "text-[0.8125rem] tracking-[0.06em] hover:text-[#2d2926] transition-[color,transform] duration-300 ease-out motion-safe:hover:-translate-y-px";

  function navLinkClass(href: string): string {
    return `${navLinkBase} ${isActive(href) ? "font-semibold text-[#2d2926]" : "text-[#5c5652]"}`;
  }

  /**
   * 메인 GNB(연령방·부모이야기·발달·꼬꼬마·정보·지역 — 홈은 로고 링크로만 이동) — 1024px(lg) 이상은 1행 절대배치 가운데.
   * 1024px 미만은 상단 1행(로고+햄버거) + 다크톤 사이드 메뉴(유틸·GNB)로 동일 링크를 옮겨
   * 뷰를 넓게 쓰고 터치 탭을 더 크게 잡는다(우하단 퀵 메뉴 z 40, 패널은 z 50).
   */
  const mainNavItems = (
    <>
      <Link
        href="/community/baby-story"
        className={`${navLinkBase} ${babyStoryIsActive ? "font-semibold text-[#2d2926]" : "text-[#5c5652]"}`}
      >
        아기이야기
      </Link>
      <Link href="/parent-stories" className={navLinkClass("/parent-stories")}>
        부모이야기
      </Link>
      {/*
        꼬꼬마에 `ml-auto` 를 두면 모바일(2행·flex-wrap)에서 부모이야기 다음 칸 전체가 비는 것처럼 보여
        텍스트 좌측에 불필요한 여백이 생긴다 — 데스크톱(lg) 중앙 GNB도 gap 만으로 간격이 나오므로 auto 마진은 쓰지 않는다.
      */}
      <Link
        href="/community/kokkoma"
        className={`${navLinkClass("/community/kokkoma")} shrink-0`}
      >
        꼬꼬마
      </Link>
      <Link href="/info" className={navLinkClass("/info")}>
        정보
      </Link>
      <Link href="/region" className={navLinkClass("/region")}>
        지역
      </Link>
    </>
  );

  /**
   * 사이드 메뉴 전용 GNB — 데스크톱과 동일한 href·활성 판정을 쓰되,
   * 터치·가독성을 위해 큰 탭 영역·밝은 텍스트(다크 패널 대비)로 다시 쓴다.
   */
  function sideMenuNavLinkClass(href: string): string {
    const active = isActive(href) || (href === "/community/baby-story" && babyStoryIsActive);
    return `block w-full border-b border-white/10 py-3.5 pe-2 text-left text-base font-semibold tracking-[0.04em] transition-colors ${
      active ? "text-[#e8a090]" : "text-white/95 hover:text-white"
    }`;
  }

  const sideMenuMainNavItems = (
    <>
      <Link
        href="/community/baby-story"
        className={sideMenuNavLinkClass("/community/baby-story")}
        onClick={() => requestCloseSideMenu()}
      >
        아기이야기
      </Link>
      <Link
        href="/parent-stories"
        className={sideMenuNavLinkClass("/parent-stories")}
        onClick={() => requestCloseSideMenu()}
      >
        부모이야기
      </Link>
      <Link
        href="/community/kokkoma"
        className={sideMenuNavLinkClass("/community/kokkoma")}
        onClick={() => requestCloseSideMenu()}
      >
        꼬꼬마
      </Link>
      <Link href="/info" className={sideMenuNavLinkClass("/info")} onClick={() => requestCloseSideMenu()}>
        정보
      </Link>
      <Link href="/region" className={sideMenuNavLinkClass("/region")} onClick={() => requestCloseSideMenu()}>
        지역
      </Link>
    </>
  );

  return (
    <nav
      className={`w-full shrink-0 border-b border-[#2d2926]/[0.06] bg-[#faf9f6] px-4 sm:px-6 sticky top-0 z-30 transition-shadow duration-200 ${isScrolled ? "shadow-[0_2px_16px_rgba(45,41,38,0.09)]" : ""}`}
      style={{
        /* 전역 @theme --font-sans(로컬 Pretendard) — 로고 링크만 `font-serif`로 덮어씀 */
        fontFamily: "var(--font-sans)",
      }}
    >
      {/*
        모든 화면에서 `sticky` — `z-30` 은 `RightQuickMenu` z-40, 전면 사이드 z-50 아래.
      */}
      <div className="relative mx-auto flex max-w-6xl flex-col gap-3 py-4 lg:gap-0">
        <div className="relative flex min-h-[2.5rem] items-center justify-between gap-2 sm:gap-3 md:gap-6">
          {/*
            브랜드 심볼(PNG) + wordmark(logo.svg) — 심볼은 학사모·하트로 ‘전문+돌봄’을 직관적으로 보여 주고,
            alt 는 wordmark 한 곳에만 둬 스크린리더가 같은 문구를 두 번 읽지 않게 한다.
          */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-2 sm:gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c57b67]/40"
            aria-label="육아박사 홈"
          >
            
            <Image
              src="/logo.svg"
              alt="육아박사"
              width={600}
              height={150}
              className="h-16 w-auto"
              priority
            />
          </Link>

          {/* lg 이상: 1행 레이아웃 — 정중앙에서 약 3rem 만큼 왼쪽으로 당겨 로고와의 간격을 확보 */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-[calc(50%+3rem)] -translate-y-1/2 items-center gap-8 pr-6 lg:flex lg:pr-10">
            {mainNavItems}
          </div>

          <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 pl-1 sm:gap-2 sm:pl-2 md:gap-3 md:pl-3 lg:gap-3 lg:pl-3">
            {/*
              lg 이상에서만 상단에 유틸을 노출 — lg 미만은 동일 링크를 사이드 메뉴에만 두고
              상단은 햄버거로 한 번에 정리해 작은 뷰에서의 줄바꿈·겹침을 줄인다.
            */}
            <div
              suppressHydrationWarning
              className="hidden min-w-0 items-center justify-end gap-2 sm:gap-3 md:gap-4 lg:flex lg:gap-5"
            >
              {nickname ? (
                <>
                  <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3.5">
                    {primaryChildAgeLabel ? (
                      <span
                        className="shrink-0 text-[0.7rem] font-semibold leading-tight text-[#5c4033] sm:text-[0.75rem]"
                        title="기준 아이 생일(달력) 기준, 태어난 뒤 경과한 기간(년·개월·일)"
                      >
                        {primaryChildAgeLabel}
                      </span>
                    ) : null}
                    <Link
                      href="/baby-records"
                      className={`shrink-0 text-[0.8125rem] font-medium text-[#5c4033] transition-[color,transform] duration-200 ease-out hover:text-[#3d2a20] motion-safe:hover:-translate-y-px ${
                        isActive("/baby-records") ? "font-semibold text-[#3d2a20]" : ""
                      }`}
                      title="아기 성장·일상 기록"
                    >
                      아이기록
                    </Link>
                  </div>
                  <span className="hidden max-w-[7rem] truncate text-sm text-[#5c4033] sm:inline">
                    <Link
                      href="/mypage"
                      className="font-medium text-[#5c4033] hover:text-[#3d2a20] hover:underline"
                    >
                      {nickname}
                    </Link>
                    님
                  </span>
                  <Link
                    href="/contact"
                    className="text-sm text-[#6d4c41] transition-[color,transform] duration-200 ease-out hover:text-[#3d2a20] motion-safe:hover:-translate-y-px"
                  >
                    문의하기
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-[#6d4c41] transition-[color,transform] duration-200 ease-out hover:text-[#3d2a20] motion-safe:hover:-translate-y-px active:scale-95"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-[#5c5652] transition-[color,transform] duration-200 ease-out hover:text-[#2d2926] motion-safe:hover:-translate-y-px"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-[#c57b67] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(197,123,103,0.35)] transition-[transform,box-shadow,filter] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(197,123,103,0.45)] hover:brightness-105 active:translate-y-0 active:scale-[0.98] motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
            {/*
              lg 미만 전용: 닫힌 때는 3선(햄버거), 열리면 X 로 바꾸는 단일 토글 버튼 — 참고 UI와 같이
              `aria-expanded`로 패널과 동기를 맞혀 키보드·SR 사용자에게 펼침/접힘을 알린다.
            */}
            <button
              type="button"
              onClick={() => {
                if (isSideMenuMounted) {
                  requestCloseSideMenu();
                } else {
                  setIsSideMenuMounted(true);
                }
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#2d2926] transition hover:bg-[#2d2926]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c57b67]/50 lg:hidden"
              aria-label={isSideMenuMounted ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isSideMenuMounted}
              aria-controls="siteSideMenuPanel"
            >
              {isSideMenuMounted ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  className="shrink-0"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  className="shrink-0"
                  aria-hidden
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/*
        RightQuickMenu 가 z-40 이므로 50에 두고, `lg:hidden`으로 데스크톱에서는 포털·포커스 루프를 타지 않게 한다.
        패널을 뷰포트 100% 갈색으로 쓸 때는 별도 딤을 두지 않고(전면이 곧 메뉴) 닫기는 상단 X·Escape·경로 이동에 맡긴다.
      */}
      {isSideMenuMounted ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-stretch pointer-events-auto lg:hidden"
          role="presentation"
        >
          {/*
            투명 풀스크린 래퍼: 슬라이드 중에도 좌측이 비어 보일 때 뒤 콘텐츠로 포인터가 새지 않게 막는다.
          */}
          <aside
            id="siteSideMenuPanel"
            onTransitionEnd={onSideMenuPanelTransitionEnd}
            className={[
              "flex h-[100dvh] w-full min-w-0 flex-col bg-[#4a3228] text-white",
              "transform-gpu will-change-transform",
              "transition-[transform,opacity] duration-300 ease-out",
              isSideMenuPanelEnter
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0",
              "motion-reduce:translate-x-0 motion-reduce:opacity-100 motion-reduce:duration-0",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label="육아박사 사이트 메뉴"
          >
            {/*
              상단: 이전 로고 자리(좌)에만 유틸(로그인/마이/문의 등)을 가로로 모으고, 우측에 닫기.
              GNB(아래 본문)과 역할이 겹치지 않게 `border-b`로 구역만 구분한다.
            */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5 sm:gap-x-3">
                {nickname ? (
                  <>
                    {primaryChildAgeLabel ? (
                      <span
                        className="shrink-0 text-[0.7rem] font-medium text-white/70 sm:text-xs"
                        title="기준 아이 생일(달력) 기준, 태어난 뒤 경과한 기간(년·개월·일)"
                      >
                        {primaryChildAgeLabel}
                      </span>
                    ) : null}
                    <Link
                      href="/baby-records"
                      className="shrink-0 text-sm font-medium text-white/95 transition hover:text-white"
                      onClick={() => requestCloseSideMenu()}
                    >
                      아이기록
                    </Link>
                    <Link
                      href="/mypage"
                      title="마이페이지"
                      className="max-w-[8rem] shrink truncate text-sm font-medium text-white/95 transition hover:text-white sm:max-w-[10rem]"
                      onClick={() => requestCloseSideMenu()}
                    >
                      {nickname}
                    </Link>
                    <Link
                      href="/contact"
                      className="shrink-0 text-sm font-medium text-white/95 transition hover:text-white"
                      onClick={() => requestCloseSideMenu()}
                    >
                      문의하기
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        requestCloseSideMenu();
                        handleLogout();
                      }}
                      className="shrink-0 text-sm font-medium text-white/80 transition hover:text-white"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="shrink-0 text-sm font-medium text-white/95 transition hover:text-white"
                      onClick={() => requestCloseSideMenu()}
                    >
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#c57b67] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] sm:px-3.5 sm:py-2 sm:text-sm"
                      onClick={() => requestCloseSideMenu()}
                    >
                      {/*
                        갈색 전면 패널용으로 예전에 쓰던 테라코타 pill + 작은 `shadow` — 좁은 상단에 맞게 `px`·`text` 만 데스크톱보다 약간 작게.
                      */}
                      회원가입
                    </Link>
                  </>
                )}
              </div>
              <button
                type="button"
                ref={sideMenuPanelCloseRef}
                onClick={() => requestCloseSideMenu()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/95 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                aria-label="메뉴 닫기"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  className="shrink-0"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-5">
              {/*
                GNB — 데스크톱 중앙 5개 링크. 시각용 ‘메뉴’ 타이틀은 빼고 `nav`의 `aria-label`만 둬 SR 에 영역을 알린다.
              */}
              <nav className="flex flex-col" aria-label="주요 메뉴">
                {sideMenuMainNavItems}
              </nav>
            </div>
          </aside>
        </div>
      ) : null}
    </nav>
  );
}
