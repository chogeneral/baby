"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { communityBoardTitle } from "@/lib/communityBoard";
import {
  communityRoomPath,
  getCommunityRoomFromBirthYears,
} from "@/lib/communityRoom";
import { readLoginSession } from "@/lib/loginSession";

/**
 * /community — 대표 연도가 이미 있으면 곧바로 맞는 방으로 보내고,
 * 없으면 마이페이지 설정 안내만 한다(세 방을 직접 고르지 않음).
 */
export default function CommunityHubPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = readLoginSession();
    const myRoom = getCommunityRoomFromBirthYears(session?.childBirthYears);
    if (myRoom) {
      router.replace(communityRoomPath[myRoom]);
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500 text-sm">
        게시판으로 연결 중…
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        연령별 게시판
      </p>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mt-1">
        {communityBoardTitle}
      </h1>
      <p className="text-sm text-gray-600 mt-4 leading-relaxed">
        영아방·토들러방·유아방 중 어디를 볼지는{" "}
        <strong>마이페이지에서 선택한 아이 대표 출생 연도</strong>로 정해져요. 연령과 상관없이
        익명으로만 나누고 싶다면{" "}
        <Link href="/community/kokkoma" className="text-indigo-600 font-medium hover:underline">
          꼬꼬마(익명게시판)
        </Link>
        을 이용해 주세요.
      </p>
      <ul className="mt-4 text-sm text-gray-600 space-y-2 list-disc list-inside">
        <li>1살까지(연도 기준) → 영아방</li>
        <li>2살까지 → 토들러방</li>
        <li>3~5살(6살 이상 포함) → 유아방</li>
      </ul>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/mypage"
          className="inline-flex justify-center bg-indigo-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          대표 연도 설정하기
        </Link>
        <Link
          href="/login"
          className="inline-flex justify-center border border-gray-300 text-gray-700 px-4 py-2.5 rounded-md text-sm hover:bg-gray-50"
        >
          로그인
        </Link>
      </div>
    </main>
  );
}
