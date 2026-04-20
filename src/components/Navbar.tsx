"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { communityBoardShortLabel } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  getCommunityRoomFromBirthYears,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { clearLoginSession, readLoginSession } from "@/lib/loginSession";

export function Navbar() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);
  /** 대표 연도가 있으면 그 나이에 맞는 방 하나만 네비에 노출한다 */
  const [myRoomKind, setMyRoomKind] = useState<CommunityRoomKind | null>(null);

  useEffect(() => {
    const session = readLoginSession();
    setNickname(session?.nickname ?? session?.email ?? null);
    setMyRoomKind(getCommunityRoomFromBirthYears(session?.childBirthYears));
  }, []);

  function handleLogout() {
    clearLoginSession();
    setNickname(null);
    setMyRoomKind(null);
    router.push("/");
    router.refresh();
  }

  const boardNavHref = myRoomKind ? communityRoomPath[myRoomKind] : "/community";
  const boardNavLabel = myRoomKind
    ? communityRoomLabels[myRoomKind].roomName
    : communityBoardShortLabel;

  return (
    <nav className="w-full bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/" className="text-lg font-bold text-indigo-600 tracking-tight">
          육아도사
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
          <Link
            href={boardNavHref}
            title={
              myRoomKind
                ? `임금님 귀는 당나귀 귀 — ${communityRoomLabels[myRoomKind].roomName}(대표 연도 기준)`
                : "임금님 귀는 당나귀 귀 — 마이페이지에서 대표 연도를 설정하면 맞는 방으로 안내돼요"
            }
            className="hover:text-gray-900 transition-colors text-indigo-600 font-medium"
          >
            {boardNavLabel}
          </Link>
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

      <div className="flex items-center gap-3 text-sm">
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
