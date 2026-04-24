"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { formatKoreanPhoneInput, onlyDigits } from "@/lib/formatKoreanPhone";
import { readLoginSession, saveLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";
import { isIsoDateInRange } from "@/lib/birthDateParts";
import { communityRoomLabels } from "@/lib/communityRoom";

type ChildRow = {
  /** 아이 호칭 — 가입 폼과 동일(저장·기준 아이) */
  name: string;
  /** YYYY-MM-DD (input type=date) */
  birthDate: string;
};

type UserInfo = {
  email: string;
  nickname: string;
  phone: string;
  childBirthYear: number;
  childBirthYears?: number[];
  childCount?: number;
  childNames?: string[];
  childBirthDates?: string[];
  primaryChildIndex?: number;
  createdAt: string;
};

/**
 * GET /api/me 로 받은 값으로 자녀 입력 줄을 맞춘다.
 * 옛 기록(연도만)은 1·1·1로 두어 달력에서 실제 날로 고치게 유도한다.
 */
function buildChildFormFromInfo(u: UserInfo): { childCountStr: string; childRows: ChildRow[] } {
  const nFromServer = u.childCount ?? u.childBirthYears?.length;
  if (nFromServer != null && nFromServer >= 1) {
    const n = Math.min(5, Math.max(1, nFromServer));
    const childRows: ChildRow[] = [];
    for (let i = 0; i < n; i += 1) {
      const date = u.childBirthDates?.[i];
      const y = u.childBirthYears?.[i];
      const birthDate =
        date && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? date
          : y != null
            ? `${y}-01-01`
            : "";
      childRows.push({ name: (u.childNames?.[i] ?? "").trim(), birthDate });
    }
    return { childCountStr: String(n), childRows };
  }
  if (u.childBirthYear) {
    const date0 = u.childBirthDates?.[0];
    return {
      childCountStr: "1",
      childRows: [
        {
          name: (u.childNames?.[0] ?? "").trim(),
          birthDate:
            date0 && /^\d{4}-\d{2}-\d{2}$/.test(date0)
              ? date0
              : `${u.childBirthYear}-01-01`,
        },
      ],
    };
  }
  return { childCountStr: "1", childRows: [{ name: "", birthDate: "" }] };
}

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
  /** childBirthYears 인덱스 — 어떤 아이를 ‘맞춤·연령방’ 기준으로 쓸지 */
  const [primaryChildIndex, setPrimaryChildIndex] = useState("0");
  /** 1~5 — 출산·가족 구성이 바뀌면 늘려 맞출 수 있게(가입·같은 규칙으로 저장) */
  const [childCountStr, setChildCountStr] = useState("1");
  const [childRows, setChildRows] = useState<ChildRow[]>([{ name: "", birthDate: "" }]);
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  const { maxDate } = useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return { maxDate: `${y}-${m}-${d}` };
  }, []);

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
      setPrimaryChildIndex(String(user.primaryChildIndex ?? 0));
      const { childCountStr: cStr, childRows: rows } = buildChildFormFromInfo(user);
      setChildCountStr(cStr);
      setChildRows(rows);
      setMyPosts(postsData as MyPost[]);
      setIsLoading(false);
    });
  }, [router]);

  function handleMyChildCountChange(value: string) {
    setChildCountStr(value);
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n) || n < 1 || n > 5) {
      setChildRows([]);
      return;
    }
    setChildRows((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) {
        next.push({ name: "", birthDate: "" });
      }
      return next;
    });
    setPrimaryChildIndex((prevIdxStr) => {
      const current = Number.parseInt(prevIdxStr, 10);
      if (Number.isNaN(current) || current >= n) {
        return String(Math.max(0, n - 1));
      }
      return prevIdxStr;
    });
  }

  function handleMyChildRowChange(index: number, field: keyof ChildRow, value: string) {
    setChildRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value };
      return next;
    });
  }

  /**
   * 자녀 블록은 가입·서버(validateChildProfilePayload)와 같은 규칙으로
   * 클라이언트에서 먼저 잡는다(불필요한 400·사용자 혼란을 줄이기 위함).
   */
  function parseValidChildren(
    countStr: string,
    rows: ChildRow[],
  ):
    | { ok: true; count: number; childNames: string[]; childBirthDates: string[] }
    | { ok: false; message: string } {
    const countNum = Number.parseInt(countStr, 10);
    if (!countStr.trim() || Number.isNaN(countNum) || countNum < 1 || countNum > 5) {
      return { ok: false, message: "자녀 수는 1~5로 입력해 주세요." };
    }
    if (rows.length !== countNum) {
      return { ok: false, message: "자녀 수에 맞게 각 아이의 이름·생일을 넣어 주세요." };
    }
    const childNames: string[] = [];
    const childBirthDates: string[] = [];
    for (let i = 0; i < countNum; i += 1) {
      const r = rows[i] ?? { name: "", birthDate: "" };
      const nm = r.name.trim();
      if (!nm) {
        return { ok: false, message: `${i + 1}번째 아이 이름을 입력해 주세요.` };
      }
      if (nm.length > 24) {
        return { ok: false, message: `${i + 1}번째 아이 이름은 24자 이하로 입력해 주세요.` };
      }
      if (!r.birthDate) {
        return { ok: false, message: `${i + 1}번째 아이 생일을 선택해 주세요.` };
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.birthDate)) {
        return { ok: false, message: `${i + 1}번째 아이 생일을 다시 선택해 주세요.` };
      }
      if (!isIsoDateInRange(r.birthDate, "1990-01-01", maxDate)) {
        return { ok: false, message: `${i + 1}번째 아이의 생일은 1990-01-01 ~ 오늘 사이여야 합니다.` };
      }
      childNames.push(nm);
      childBirthDates.push(r.birthDate);
    }
    return { ok: true, count: countNum, childNames, childBirthDates };
  }

  async function handleInfoSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInfoError("");
    setInfoSuccess("");

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      setInfoError("닉네임은 2~20자로 입력해 주세요.");
      return;
    }

    const childParsed = parseValidChildren(childCountStr, childRows);
    if (!childParsed.ok) {
      setInfoError(childParsed.message);
      return;
    }
    const primaryIdx = Number.parseInt(primaryChildIndex, 10);
    if (
      Number.isNaN(primaryIdx) ||
      primaryIdx < 0 ||
      primaryIdx >= childParsed.count
    ) {
      setInfoError("기준 아이를 다시 선택해 주세요.");
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
          childCount: childParsed.count,
          childNames: childParsed.childNames,
          childBirthDates: childParsed.childBirthDates,
          primaryChildIndex: primaryIdx,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setInfoError(data.message ?? "수정에 실패했습니다.");
        return;
      }

      const meRes = await fetch(`/api/me?email=${encodeURIComponent(email)}`);
      const me = (await meRes.json()) as UserInfo;
      if (!meRes.ok) {
        setInfoError("저장은 되었는데 화면을 갱신하지 못했습니다. 새로고침해 주세요.");
        return;
      }
      setInfo(me);
      setPrimaryChildIndex(String(me.primaryChildIndex ?? 0));
      const reloaded = buildChildFormFromInfo(me);
      setChildCountStr(reloaded.childCountStr);
      setChildRows(reloaded.childRows);

      const yearsFromMe = me.childBirthYears ?? childParsed.childBirthDates.map((d) =>
        Number.parseInt(d.slice(0, 4), 10),
      );
      saveLoginSession({
        email,
        nickname: trimmedNickname,
        phoneDigits: onlyDigits(phone),
        childCount: me.childCount ?? childParsed.count,
        childBirthYears: yearsFromMe,
        childBirthDates: me.childBirthDates,
        primaryChildIndex: me.primaryChildIndex ?? primaryIdx,
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

  return (
    <main className={nestForm.nestPage}>
      <div className={nestForm.nestMypageGrid}>
        <div className={nestForm.nestMypageGridTitle}>
          <h1 className={nestForm.nestTitle}>마이페이지</h1>
        </div>

        <div className={nestForm.nestMypageGridLeft}>
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

            <hr className={nestForm.nestMypageDivider} aria-hidden="true" />

            {/* 휴대폰 직후: 아기이야기 글쓰기 등은 기준 아이 1명 기준 — 자녀 상세(이름·생일)는 아래에서 입력·저장 */}
            <div
              className={`${nestForm.nestNotice} ${nestForm.nestMypageAfterPhone}`}
            >
              <h3 className={nestForm.nestNoticeTitle}>맞춤·게시판 기준 아이</h3>
              <p className={nestForm.nestNoticeSub} style={{ marginTop: "0.35rem" }}>
                아기이야기 글쓰기·프로필 연동은 여기서 고른 기준 아이를 바탕으로 맞춰져요.
                이름·생일은 바로 이어지는 자녀 정보에서 입력한 뒤 저장하면 같이 반영돼요.
                둘째·셋째를 기준으로 쓰고 싶다면 이 목록에서 골라 주세요.
              </p>
            </div>

            {childRows.length > 0 ? (
              <div className={nestForm.nestMypageTightAfterPrimaryIntro}>
                <label htmlFor="myPrimaryChild" className={nestForm.nestLabel}>
                  기준 아이 선택
                </label>
                <select
                  id="myPrimaryChild"
                  value={primaryChildIndex}
                  onChange={(e) => {
                    setPrimaryChildIndex(e.target.value);
                    if (infoError) setInfoError("");
                  }}
                  className={nestForm.nestSelect}
                >
                  {childRows.map((row, i) => {
                    const name = row.name.trim() || `${i + 1}번째 아이`;
                    const birthPart =
                      row.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(row.birthDate)
                        ? `${row.birthDate.slice(0, 10).replace(/-/g, ".")} 생`
                        : "생일을 선택하면 정확히 보여요";
                    return (
                      <option key={i} value={String(i)}>
                        {name} · {birthPart}
                      </option>
                    );
                  })}
                </select>
                <p className={nestForm.nestHint} style={{ marginTop: "0.35rem" }}>
                  {`선택한 아이가 아기이야기·프로필 기준이에요. (${communityRoomLabels.babyStory.ageHint})`}
                </p>
              </div>
            ) : null}

            {childRows.length > 0 ? (
              <hr className={nestForm.nestMypageDivider} aria-hidden="true" />
            ) : null}

            <div
              className={`${nestForm.nestNotice} ${nestForm.nestMypageChildInfoFollows} ${nestForm.nestMypageChildInfoNoticeSlim}`}
            >
              <h3 className={nestForm.nestNoticeTitle}>자녀 정보</h3>
              <p className={nestForm.nestNoticeSub} style={{ marginTop: "0.35rem" }}>
                둘째·셋째가 생기면 자녀 수를 늘리고, 아이마다 호칭과 생일을 맞춰 주세요. 저장
                시 회원가입과 같은 기준(이름 24자, 생일 1990~오늘)으로 확인합니다.
              </p>
            </div>

            <div className={nestForm.nestMypageTightAfterChildInfoIntro}>
              <label htmlFor="myChildCount" className={nestForm.nestLabel}>
                자녀 수
              </label>
              <input
                id="myChildCount"
                type="number"
                inputMode="numeric"
                min={1}
                max={5}
                value={childCountStr}
                onChange={(e) => {
                  handleMyChildCountChange(e.target.value);
                  if (infoError) setInfoError("");
                }}
                className={nestForm.nestInput}
              />
            </div>

            {childRows.map((row, i) => (
              <div
                key={i}
                className={nestForm.nestTightStack}
                /* 첫 아이: 자녀 수 필드 직후만 살짝 띄움, 둘째부터는 덩어리 구분용 여백 */
                style={{
                  marginTop: "0.5rem",
                  borderBottom: i < childRows.length - 1 ? "1px dashed #2d292614" : undefined,
                  paddingBottom: i < childRows.length - 1 ? "1.25rem" : undefined,
                }}
              >
                <p className={nestForm.nestLabel} style={{ margin: "0 0 0.25rem" }}>
                  {i + 1}번째 아이
                </p>
                <div style={{ marginTop: "0.15rem" }}>
                  <label className={nestForm.nestLabel} htmlFor={`myChildName-${i}`}>
                    이름(호칭)
                  </label>
                  <input
                    id={`myChildName-${i}`}
                    type="text"
                    maxLength={24}
                    value={row.name}
                    onChange={(e) => handleMyChildRowChange(i, "name", e.target.value)}
                    className={nestForm.nestInput}
                    placeholder="예: 우리 콩이"
                  />
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <label className={nestForm.nestLabel} htmlFor={`myChildDate-${i}`}>
                    생년월일
                  </label>
                  <input
                    id={`myChildDate-${i}`}
                    type="date"
                    min="1990-01-01"
                    max={maxDate}
                    value={row.birthDate}
                    onChange={(e) => handleMyChildRowChange(i, "birthDate", e.target.value)}
                    className={nestForm.nestInput}
                  />
                </div>
              </div>
            ))}

            {infoError ? <p className={nestForm.nestError}>{infoError}</p> : null}
            {infoSuccess ? <p className={nestForm.nestSuccess}>{infoSuccess}</p> : null}

            <button type="submit" disabled={isSaving} className={nestForm.nestBtnPrimary} style={{ marginTop: "1.15rem" }}>
              {isSaving ? "저장 중…" : "저장"}
            </button>
          </form>
        </section>
        </div>

        <div className={nestForm.nestMypageGridRight}>
        {/* 비밀번호 변경 */}
        <section>
          <h2 className={nestForm.nestSectionTitle} >비밀번호 변경</h2>

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

            <button type="submit" disabled={isChangingPw} className={nestForm.nestBtnNeutral} style={{ marginTop: "1.15rem" }}>
              {isChangingPw ? "변경 중…" : "비밀번호 변경"}
            </button>
          </form>
        </section>

        {/* 내가 쓴 글 — 우측 퀵메뉴(글쓰기 기록)에서 #myWrites 로 스크롤 이동 */}
        <section id="myWrites">
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
      </div>
    </main>
  );
}
