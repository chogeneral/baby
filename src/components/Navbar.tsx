"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { communityBoardTitle } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  getCommunityRoomFromBirthYears,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { getNavPrimaryChildAgeLabel } from "@/lib/primaryChildAgeLabel";
import { clearLoginSession, readLoginSession } from "@/lib/loginSession";

function readSessionNickname(): string | null {
  const session = readLoginSession();
  const nick = session?.nickname?.trim();
  return nick || session?.email || null;
}

function readSessionRoomKind(): CommunityRoomKind | null {
  const session = readLoginSession();
  return getCommunityRoomFromBirthYears(
    session?.childBirthYears,
    new Date(),
    session?.primaryChildIndex ?? 0,
  );
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
  const [myRoomKind, setMyRoomKind] = useState<CommunityRoomKind | null>(null);
  /** session에 있는 기준 아이 datepicker(YYYY-MM-DD)로 둔 나이 — ‘아이기록’ 링크 왼쪽 */
  const [primaryChildAgeLabel, setPrimaryChildAgeLabel] = useState<string | null>(null);

  /* pathname 변경(로그인·로그아웃 직후 등)에 맞춰 sessionStorage와 네비 라벨을 동기화한다 */
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 클라이언트 네비게이션 후 세션과 경로를 맞추기 위한 동기 읽기
    setNickname(readSessionNickname());
    setMyRoomKind(readSessionRoomKind());
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

  function handleLogout() {
    clearLoginSession();
    setNickname(null);
    setMyRoomKind(null);
    setPrimaryChildAgeLabel(null);
    router.push("/");
    router.refresh();
  }

  const boardNavHref = myRoomKind ? communityRoomPath[myRoomKind] : "/community";
  /** 대표 연도가 있으면 영아·토들러·유아 방 이름만, 없으면 브랜드명만(닉네임 표시 문구는 네비에 쓰지 않음) */
  const boardNavLabel = myRoomKind
    ? communityRoomLabels[myRoomKind].roomName
    : communityBoardTitle;

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
   * 메인 GNB(홈·연령방·부모이야기·발달·꼬꼬마) — 1024px(lg) 이상은 1행 절대배치 가운데,
   * 1024px 미만은 이미지와 같이 2행(1행: 로고+우측 / 2행: 링크 전체·왼쪽 정렬)으로 고정해
   * 햄버거·세로 쌓기 없이 동일한 정보 구조를 유지한다.
   */
  const mainNavItems = (
    <>
      <Link href="/" className={navLinkClass("/")}>
        홈
      </Link>
      {nickname && (
        <Link
          href={boardNavHref}
          title={
            myRoomKind
              ? `${communityRoomLabels[myRoomKind].roomName}(대표 연도 기준)`
              : "마이페이지에서 대표 연도를 설정하면 맞는 방으로 안내돼요"
          }
          className={`${navLinkBase} ${pathname.startsWith("/community") && !pathname.startsWith("/community/kokkoma") ? "font-semibold text-[#2d2926]" : "text-[#5c5652]"}`}
        >
          {boardNavLabel}
        </Link>
      )}
      <Link href="/parent-stories" className={navLinkClass("/parent-stories")}>
        부모이야기
      </Link>
      <Link href="/development" className={navLinkClass("/development")}>
        발달
      </Link>
      <Link href="/community/kokkoma" className={navLinkClass("/community/kokkoma")}>
        꼬꼬마
      </Link>
    </>
  );

  return (
    <nav
      className="w-full border-b border-[#2d2926]/[0.06] bg-[#faf9f6] px-4 sm:px-6"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="relative mx-auto flex max-w-6xl flex-col gap-3 py-4 lg:gap-0">
        <div className="relative flex min-h-[2.5rem] items-center justify-between gap-2 sm:gap-3 md:gap-6">
          <Link
            href="/"
            className="shrink-0 font-serif text-xl font-semibold tracking-tight text-[#2d2926] sm:text-[1.35rem]"
          >
            육아도사
          </Link>

          {/* lg 이상: 1행 레이아웃 — 가운데 GNB(우측 닉·로그아웃과 겹침을 줄이기 위해 pr 유지) */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 pr-6 lg:flex lg:pr-10">
            {mainNavItems}
          </div>

          <div
            suppressHydrationWarning
            className="flex min-w-0 shrink-0 items-center justify-end gap-2 pl-1 sm:gap-3 sm:pl-2 md:gap-4 md:pl-4 lg:gap-5 lg:pl-4"
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
                className="hidden text-sm text-[#5c5652] transition-[color,transform] duration-200 ease-out hover:text-[#2d2926] motion-safe:hover:-translate-y-px sm:inline"
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
        </div>

        {/*
          1024px 미만 전용 2번째 행: 상단과 동일한 mainNavItems를 재사용해
          육아도사 타이틀 시작선과 맞춰 왼쪽부터 가로 나열한다(햄버거/가로 스크롤 단일 행 대신 flex-wrap).
        */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4 lg:hidden">
          {mainNavItems}
        </div>
      </div>
    </nav>
  );
}
