"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 로그인 후 이메일로 API 호출하기 전 동기 설정
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
        const data = (await res.json()) as { message?: string };
        setInfoError(data.message ?? "수정에 실패했습니다.");
        return;
      }

      setInfo((prev) =>
        prev
          ? {
              ...prev,
              nickname: trimmedNickname,
              phone: onlyDigits(phone),
              childBirthYear: Number(childBirthYear),
            }
          : prev,
      );

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
        const data = (await res.json()) as { message?: string };
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
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMessage}>불러오는 중…</p>
      </main>
    );
  }

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1990; y -= 1) years.push(y);

  return (
    <main className={nestForm.nestPage}>
      <div className={nestForm.nestStack}>
        <div>
          <p className={nestForm.nestTag}>계정</p>
          <h1 className={nestForm.nestTitle}>마이페이지</h1>
        </div>

        {/* 내 정보 수정 */}
        <section>
          <h2 className={nestForm.nestSectionTitle}>내 정보</h2>

          <form onSubmit={handleInfoSave} className={nestForm.nestForm}>
            <div>
              <span className={nestForm.nestLabel}>이메일</span>
              <p className={nestForm.nestReadonly}>{info?.email}</p>
            </div>

            <div>
              <label htmlFor="myNickname" className={nestForm.nestLabel}>
                닉네임
              </label>
              <input
                id="myNickname"
                type="text"
                maxLength={24}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={nestForm.nestInput}
              />
            </div>

            <div>
              <label htmlFor="myPhone" className={nestForm.nestLabel}>
                휴대폰 번호
              </label>
              <input
                id="myPhone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(formatKoreanPhoneInput(e.target.value))}
                className={nestForm.nestInput}
              />
            </div>

            {/* 메인·추천 콘텐츠는 첫째(대표) 아이 출생 연도만 사용한다 — 여러 명이면 가장 맞는 아이 기준으로 선택 */}
            <div className={nestForm.nestNotice}>
              <h3 className={nestForm.nestNoticeTitle}>아이 대표 출생 연도</h3>
              <p className={nestForm.nestNoticeSub} style={{ marginTop: "0.35rem" }}>
                맞춤 안내(예: 만 1세 이하 시 신생아 관리 추천)에 쓰는 기준이에요. 둘째·셋째만
                있다면 안내를 받고 싶은 아이를 골라 주세요.
              </p>
            </div>

            <div>
              <label htmlFor="myBirthYear" className={nestForm.nestLabel}>
                대표 연도 선택
              </label>
              <select
                id="myBirthYear"
                value={childBirthYear}
                onChange={(e) => setChildBirthYear(e.target.value)}
                className={nestForm.nestSelect}
              >
                <option value="">연도를 선택해 주세요</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}년생 (대표)
                  </option>
                ))}
              </select>
            </div>

            {infoError ? <p className={nestForm.nestError}>{infoError}</p> : null}
            {infoSuccess ? <p className={nestForm.nestSuccess}>{infoSuccess}</p> : null}

            <button type="submit" disabled={isSaving} className={nestForm.nestBtnPrimary}>
              {isSaving ? "저장 중…" : "저장"}
            </button>
          </form>
        </section>

        {/* 비밀번호 변경 */}
        <section>
          <h2 className={nestForm.nestSectionTitle}>비밀번호 변경</h2>

          <form onSubmit={handlePasswordChange} className={nestForm.nestForm}>
            <div>
              <label htmlFor="currentPw" className={nestForm.nestLabel}>
                현재 비밀번호
              </label>
              <input
                id="currentPw"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={nestForm.nestInput}
              />
            </div>

            <div>
              <label htmlFor="newPw" className={nestForm.nestLabel}>
                새 비밀번호
              </label>
              <input
                id="newPw"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={nestForm.nestInput}
              />
            </div>

            {pwError ? <p className={nestForm.nestError}>{pwError}</p> : null}
            {pwSuccess ? <p className={nestForm.nestSuccess}>{pwSuccess}</p> : null}

            <button type="submit" disabled={isChangingPw} className={nestForm.nestBtnNeutral}>
              {isChangingPw ? "변경 중…" : "비밀번호 변경"}
            </button>
          </form>
        </section>

        {/* 내가 쓴 글 */}
        <section>
          <h2 className={nestForm.nestSectionTitle}>
            내가 쓴 글 <span className={nestForm.nestAccentCount}>{myPosts.length}</span>
          </h2>

          {myPosts.length === 0 ? (
            <p className={nestForm.nestMuted}>아직 작성한 글이 없어요.</p>
          ) : (
            <ul className={nestForm.nestPostList}>
              {myPosts.map((post) => (
                <li key={post.id}>
                  <Link href={`/community/${post.id}`} className={nestForm.nestPostLink}>
                    <span className={nestForm.nestPostTitle}>{post.title}</span>
                    <span className={nestForm.nestPostDate}>{formatDate(post.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
