"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatKoreanPhoneInput, onlyDigits } from "@/lib/formatKoreanPhone";
import { readLoginSession, saveLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";

type UserInfo = {
  email: string;
  nickname: string;
  phone: string;
  childBirthYear: number;
  createdAt: string;
};

type MyPost = {
  id: string;
  title: string;
  createdAt: string;
};

export default function MyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [childBirthYear, setChildBirthYear] = useState("");
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setEmail(session.email);

    Promise.all([
      fetch(`/api/me?email=${encodeURIComponent(session.email)}`).then((r) => r.json()),
      fetch(`/api/posts?authorEmail=${encodeURIComponent(session.email)}`).then((r) => r.json()),
    ]).then(([userData, postsData]) => {
      const user = userData as UserInfo;
      setInfo(user);
      setNickname(user.nickname ?? "");
      setPhone(formatKoreanPhoneInput(user.phone ?? ""));
      setChildBirthYear(String(user.childBirthYear ?? ""));
      setMyPosts(postsData as MyPost[]);
      setIsLoading(false);
    });
  }, [router]);

  async function handleInfoSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInfoError("");
    setInfoSuccess("");

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      setInfoError("닉네임은 2~20자로 입력해 주세요.");
      return;
    }

    if (!childBirthYear.trim()) {
      setInfoError("아이 대표 출생 연도를 선택해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          nickname: trimmedNickname,
          phone: onlyDigits(phone),
          childBirthYear: Number(childBirthYear),
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setInfoError(data.message ?? "수정에 실패했습니다.");
        return;
      }

      setInfo((prev) => prev ? {
        ...prev,
        nickname: trimmedNickname,
        phone: onlyDigits(phone),
        childBirthYear: Number(childBirthYear),
      } : prev);

      const yearNum = Number(childBirthYear);
      saveLoginSession({
        email,
        nickname: trimmedNickname,
        phoneDigits: onlyDigits(phone),
        /* 마이페이지는 단일 연도만 편집하므로 세션에도 1명 기준으로 맞춘다 */
        childCount: 1,
        childBirthYears: [yearNum],
      });

      setInfoSuccess("정보가 수정되었습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword.length < 8) {
      setPwError("새 비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setPwError(data.message ?? "비밀번호 변경에 실패했습니다.");
        return;
      }

      setPwSuccess("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setIsChangingPw(false);
    }
  }

  if (isLoading) {
    return <p className="text-center text-gray-400 py-16">불러오는 중…</p>;
  }

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1990; y -= 1) years.push(y);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-10">
      <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>

      {/* 내 정보 수정 */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          내 정보
        </h2>

        <form onSubmit={handleInfoSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">{info?.email}</p>
          </div>

          <div>
            <label htmlFor="myNickname" className="block text-sm font-medium text-gray-700 mb-1">
              닉네임
            </label>
            <input
              id="myNickname"
              type="text"
              maxLength={24}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="myPhone" className="block text-sm font-medium text-gray-700 mb-1">
              휴대폰 번호
            </label>
            <input
              id="myPhone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatKoreanPhoneInput(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* 메인·추천 콘텐츠는 첫째(대표) 아이 출생 연도만 사용한다 — 여러 명이면 가장 맞는 아이 기준으로 선택 */}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3 mb-1">
            <h3 className="text-sm font-semibold text-indigo-900">아이 대표 출생 연도</h3>
            <p className="text-xs text-indigo-800/90 mt-1 leading-relaxed">
              맞춤 안내(예: 만 1세 이하 시 신생아 관리 추천)에 쓰는 기준이에요. 둘째·셋째만
              있다면 안내를 받고 싶은 아이를 골라 주세요.
            </p>
          </div>
          <div>
            <label htmlFor="myBirthYear" className="block text-sm font-medium text-gray-700 mb-1">
              대표 연도 선택
            </label>
            <select
              id="myBirthYear"
              value={childBirthYear}
              onChange={(e) => setChildBirthYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">연도를 선택해 주세요</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}년생 (대표)
                </option>
              ))}
            </select>
          </div>

          {infoError && <p className="text-sm text-red-500">{infoError}</p>}
          {infoSuccess && <p className="text-sm text-indigo-600">{infoSuccess}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="self-start bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "저장 중…" : "저장"}
          </button>
        </form>
      </section>

      {/* 비밀번호 변경 */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          비밀번호 변경
        </h2>

        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <div>
            <label htmlFor="currentPw" className="block text-sm font-medium text-gray-700 mb-1">
              현재 비밀번호
            </label>
            <input
              id="currentPw"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="newPw" className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              id="newPw"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-indigo-600">{pwSuccess}</p>}

          <button
            type="submit"
            disabled={isChangingPw}
            className="self-start bg-gray-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isChangingPw ? "변경 중…" : "비밀번호 변경"}
          </button>
        </form>
      </section>

      {/* 내가 쓴 글 */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          내가 쓴 글 <span className="text-indigo-600">{myPosts.length}</span>
        </h2>

        {myPosts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">아직 작성한 글이 없어요.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {myPosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/community/${post.id}`}
                  className="flex items-center justify-between py-3 hover:text-indigo-600 transition-colors"
                >
                  <span className="text-sm text-gray-800 line-clamp-1 flex-1">{post.title}</span>
                  <span className="text-xs text-gray-400 ml-4 shrink-0">{formatDate(post.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
