"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { communityBoardTitle, displayCommunityNickname } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  getCommunityRoomFromBirthYears,
  isKokkomaBoard,
  type CommunityRoomKind,
} from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";

type Post = {
  id: string;
  title: string;
  authorNickname: string;
  childBirthYear: number;
  createdAt: string;
};

type Props = {
  /** URL로 열린 방 — 대표 연도와 다르면 맞는 방으로 보낸다 */
  roomKind: CommunityRoomKind;
};

/**
 * 대표 연도(세션)와 같은 방의 글만 불러온다.
 * 로그인했는데 다른 방 URL로 들어온 경우 본인 방으로 리다이렉트한다.
 */
export function CommunityRoomBoard({ roomKind }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const kokkomaMode = isKokkomaBoard(roomKind);

  useEffect(() => {
    const session = readLoginSession();
    setIsLoggedIn(!!session);

    /* 꼬꼬마(익명): 연령·대표 연도와 무관하게 누구나 이 목록을 본다 */
    if (kokkomaMode) {
      const q = new URLSearchParams({ boardKind: roomKind });
      fetch(`/api/posts?${q.toString()}`)
        .then((r) => r.json())
        .then((data) => setPosts(data as Post[]))
        .finally(() => setIsLoading(false));
      return;
    }

    const myRoom = getCommunityRoomFromBirthYears(session?.childBirthYears);
    /* 로그인만 하고 대표 연도가 없으면 방 목록 대신 안내 페이지로 */
    if (session && myRoom === null) {
      setRedirecting(true);
      router.replace("/community");
      return;
    }
    if (session && myRoom && myRoom !== roomKind) {
      setRedirecting(true);
      router.replace(communityRoomPath[myRoom]);
      return;
    }

    const q = new URLSearchParams({ boardKind: roomKind });
    fetch(`/api/posts?${q.toString()}`)
      .then((r) => r.json())
      .then((data) => setPosts(data as Post[]))
      .finally(() => setIsLoading(false));
  }, [roomKind, router, kokkomaMode]);

  const roomLabel = communityRoomLabels[roomKind];

  if (redirecting) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500 text-sm">
        연령에 맞는 게시판으로 이동 중…
      </main>
    );
  }

  const writeHref = kokkomaMode ? "/community/kokkoma/write" : "/community/write";

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {kokkomaMode ? "익명 게시판" : "연령별 게시판"}
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
          {communityBoardTitle}
        </h1>
        <p className="text-base font-semibold text-indigo-700 mt-2">
          {roomLabel.roomName}
          {!kokkomaMode && (
            <span className="text-sm font-normal text-gray-500"> ({roomLabel.ageHint})</span>
          )}
        </p>
        {!kokkomaMode && (
          <p className="text-sm text-gray-500 mt-2">
            글과 댓글에는 <strong className="text-gray-700">마이페이지 닉네임</strong>이
            보여요. 이 목록은 마이페이지 <strong>대표 출생 연도</strong>에 맞는 방이에요.
          </p>
        )}
        {kokkomaMode && (
          <p className="text-sm text-gray-500 mt-2">{roomLabel.ageHint}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <Link href="/community" className="text-sm text-indigo-600 hover:underline">
          ← 안내
        </Link>
        {isLoggedIn && (
          <Link
            href={writeHref}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            글쓰기
          </Link>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-16">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">이 방에 아직 작성된 글이 없어요.</p>
          {isLoggedIn ? (
            <Link href={writeHref} className="text-indigo-600 hover:underline text-sm">
              첫 번째 글을 남겨보세요 →
            </Link>
          ) : (
            <Link href="/login" className="text-indigo-600 hover:underline text-sm">
              로그인 후 글을 작성할 수 있어요 →
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/community/${post.id}`}
                className="block py-4 hover:bg-gray-50 -mx-2 px-2 rounded-md transition-colors"
              >
                <p className="font-medium text-gray-900 mb-1 line-clamp-1">{post.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="text-gray-500">
                    {kokkomaMode ? "익명" : displayCommunityNickname(post.authorNickname)}
                  </span>
                  <span>·</span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
