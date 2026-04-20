"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { communityBoardTitle } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  getCommunityRoomFromBirthYears,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { clearLoginSession, readLoginSession } from "@/lib/loginSession";

function readSessionNickname(): string | null {
  const session = readLoginSession();
  const nick = session?.nickname?.trim();
  return nick || session?.email || null;
}

function readSessionRoomKind(): CommunityRoomKind | null {
  const session = readLoginSession();
  return getCommunityRoomFromBirthYears(session?.childBirthYears);
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

  // pathname 변경(로그인·로그아웃 직후 등)에 맞춰 세션을 다시 읽는다
  useLayoutEffect(() => {
    setNickname(readSessionNickname());
    setMyRoomKind(readSessionRoomKind());
  }, [pathname]);

  function handleLogout() {
    clearLoginSession();
    setNickname(null);
    setMyRoomKind(null);
    router.push("/");
    router.refresh();
  }

  const boardNavHref = myRoomKind ? communityRoomPath[myRoomKind] : "/community";
  /** 대표 연도가 있으면 영아·토들러·유아 방 이름만, 없으면 브랜드명만(닉네임 표시 문구는 네비에 쓰지 않음) */
  const boardNavLabel = myRoomKind
    ? communityRoomLabels[myRoomKind].roomName
    : communityBoardTitle;

  return (
    <nav className="w-full bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/" className="text-lg font-bold text-indigo-600 tracking-tight">
          육아도사
        </Link>
        <div
          suppressHydrationWarning
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600"
        >
          {nickname && (
            <Link
              suppressHydrationWarning
              href={boardNavHref}
              title={
                myRoomKind
                  ? `${communityRoomLabels[myRoomKind].roomName}(대표 연도 기준)`
                  : "마이페이지에서 대표 연도를 설정하면 맞는 방으로 안내돼요"
              }
              className="hover:text-gray-900 transition-colors text-indigo-600 font-medium"
            >
              {boardNavLabel}
            </Link>
          )}
          <Link href="/development" className="hover:text-gray-900 transition-colors">
            발달
          </Link>
          <Link href="/parenting-supplies" className="hover:text-gray-900 transition-colors">
            육아용품
          </Link>
          <Link href="/parent-stories" className="hover:text-gray-900 transition-colors">
            부모이야기
          </Link>
          <Link
            href="/community/kokkoma"
            title="전 연령 익명 게시판 — 글·댓글은 익명으로만 표시돼요"
            className="hover:text-gray-900 transition-colors text-indigo-600 font-medium"
          >
            꼬꼬마(익명게시판)
          </Link>
        </div>
      </div>

      <div suppressHydrationWarning className="flex items-center gap-3 text-sm min-h-[2.25rem]">
        {nickname ? (
          <>
            <Link href="/mypage" className="text-gray-600 hover:text-gray-900 transition-colors">
              <span className="font-medium text-gray-900">{nickname}</span>님
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              로그인
            </Link>
            <Link
              href="/signup"
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
