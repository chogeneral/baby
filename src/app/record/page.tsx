"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { readLoginSession } from "@/lib/loginSession";
import { formatDate } from "@/lib/formatDate";
import type { BabyRecord } from "@/lib/babyRecordStore";

type MePayload = {
  childCount?: number;
  childNames?: string[];
  childBirthYears?: number[];
};

type PerChildFields = {
  weightKg: string;
  heightCm: string;
  headCm: string;
  dailyNote: string;
};

function emptyPerChild(): PerChildFields {
  return { weightKg: "", heightCm: "", headCm: "", dailyNote: "" };
}

/** /api/me + childBirthYears 로 자녀 수(최소 1)를 맞춘다 */
function resolveChildCount(me: MePayload): number {
  const n = me.childCount ?? me.childBirthYears?.length;
  if (n != null && n >= 1) return Math.min(5, n);
  return 1;
}

/** 자녀별 표시 이름 — 마이에서 넣은 호칭이 없으면 순번으로 */
function resolveChildLabel(me: MePayload, index: number): string {
  const raw = me.childNames?.[index]?.trim();
  if (raw) return raw;
  return `${index + 1}번째 아이`;
}

/**
 * 퀵메뉴(연필)에서 열리는 기록 화면 — 자녀 수·이름은 마이/가입과 동일하게 /api/me 로 맞춘다.
 * 몸무게·키·머리둘레·일상은 아이마다 나뉘어 있고, 저장 시 아이별로 한 건씩 쌓인다(목록에서 이름·색으로 구분).
 */
export default function RecordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [me, setMe] = useState<MePayload | null>(null);
  const [perChild, setPerChild] = useState<PerChildFields[]>([emptyPerChild()]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [records, setRecords] = useState<BabyRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const childCount = me ? resolveChildCount(me) : 1;
  const childLabels = me
    ? Array.from({ length: childCount }, (_, i) => resolveChildLabel(me, i))
    : ["1번째 아이"];

  const loadRecords = useCallback(async (authorEmail: string) => {
    setIsLoadingList(true);
    try {
      const res = await fetch(
        `/api/baby-records?authorEmail=${encodeURIComponent(authorEmail)}`,
      );
      if (res.ok) {
        setRecords((await res.json()) as BabyRecord[]);
      }
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setEmail(session.email);
    let cancelled = false;
    (async () => {
      const [meRes, recRes] = await Promise.all([
        fetch(`/api/me?email=${encodeURIComponent(session.email)}`),
        fetch(`/api/baby-records?authorEmail=${encodeURIComponent(session.email)}`),
      ]);
      if (cancelled) return;
      if (meRes.ok) {
        const data = (await meRes.json()) as MePayload;
        if (!cancelled) {
          setMe(data);
          const n = resolveChildCount(data);
          setPerChild(Array.from({ length: n }, () => emptyPerChild()));
        }
      } else {
        if (!cancelled) {
          setMe({});
          setPerChild([emptyPerChild()]);
        }
      }
      if (recRes.ok && !cancelled) {
        setRecords((await recRes.json()) as BabyRecord[]);
      }
      if (!cancelled) setIsLoadingList(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function setChildField(
    index: number,
    field: keyof PerChildFields,
    value: string,
  ) {
    setPerChild((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/baby-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorEmail: email,
          records: perChild.map((p, i) => ({
            childIndex: i,
            weightKg: p.weightKg.trim() === "" ? null : p.weightKg,
            heightCm: p.heightCm.trim() === "" ? null : p.heightCm,
            headCircumferenceCm: p.headCm.trim() === "" ? null : p.headCm,
            dailyNote: p.dailyNote,
          })),
        }),
      });
      const data = (await res.json()) as
        | { message?: string }
        | BabyRecord
        | { saved: BabyRecord[]; count: number };
      if (!res.ok) {
        setError("message" in data ? (data.message ?? "저장에 실패했습니다.") : "저장에 실패했습니다.");
        return;
      }
      const nSaved =
        typeof data === "object" && data !== null && "count" in data
          ? (data as { count: number }).count
          : 1;
      setSuccess(
        nSaved > 1 ? `기록 ${nSaved}건이 저장되었어요.` : "기록이 저장되었어요.",
      );
      setPerChild(Array.from({ length: childCount }, () => emptyPerChild()));
      loadRecords(email);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!email) {
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMessage}>이동 중…</p>
      </main>
    );
  }

  return (
    <main className={nestForm.nestPage}>
      <div className={nestForm.nestStack}>
        <div>
          <p className={nestForm.nestTag}>기록</p>
          <h1 className={nestForm.nestTitle}>아기 성장·일상</h1>
          <p className={nestForm.nestLead}>
            마이·가입에서 넣은 아이 수만큼 아래에 입력란이 나뉘어 있어요. 한 번
            저장할 때는 최소 한 아이 칸에 몸무게·키·머리둘레 중 하나, 또는
            일상이 있어야 해요(비어 있는 아이는 저장되지 않아요). 최근 기록은
            아이 이름과 색으로 구분돼요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={nestForm.nestForm}>
          {perChild.map((p, i) => (
            <div
              key={i}
              className={nestForm.nestRecordChildSection}
              data-index={String(i % 5)}
            >
              <p className={nestForm.nestRecordChildName}>
                {childLabels[i] ?? `${i + 1}번째 아이`}
              </p>
              <div>
                <label
                  htmlFor={`recordWeight-${i}`}
                  className={nestForm.nestLabel}
                >
                  몸무게 (kg)
                </label>
                <input
                  id={`recordWeight-${i}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={p.weightKg}
                  onChange={(e) => setChildField(i, "weightKg", e.target.value)}
                  className={nestForm.nestInput}
                  placeholder="예: 8.25"
                />
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <label
                  htmlFor={`recordHeight-${i}`}
                  className={nestForm.nestLabel}
                >
                  키 (cm)
                </label>
                <input
                  id={`recordHeight-${i}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={p.heightCm}
                  onChange={(e) => setChildField(i, "heightCm", e.target.value)}
                  className={nestForm.nestInput}
                  placeholder="예: 68.5"
                />
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <label htmlFor={`recordHead-${i}`} className={nestForm.nestLabel}>
                  머리둘레 (cm)
                </label>
                <input
                  id={`recordHead-${i}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={p.headCm}
                  onChange={(e) => setChildField(i, "headCm", e.target.value)}
                  className={nestForm.nestInput}
                  placeholder="예: 42.0"
                />
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <label htmlFor={`recordDaily-${i}`} className={nestForm.nestLabel}>
                  {childLabels[i] ?? "아이"}의 일상
                </label>
                <textarea
                  id={`recordDaily-${i}`}
                  rows={4}
                  value={p.dailyNote}
                  onChange={(e) => setChildField(i, "dailyNote", e.target.value)}
                  className={`${nestForm.nestTextarea} ${nestForm.nestTextareaGrow}`}
                  placeholder="잠·수유·놀이·기분 등 오늘 느낀 점을 자유롭게 적어 주세요."
                />
              </div>
            </div>
          ))}

          {error ? <p className={nestForm.nestError}>{error}</p> : null}
          {success ? <p className={nestForm.nestSuccess}>{success}</p> : null}

          <div className={nestForm.nestActions}>
            <Link href="/" className={`${nestForm.nestBtnSecondary} ${nestForm.flex1}`}>
              홈
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${nestForm.nestBtnPrimary} ${nestForm.flex1}`}
            >
              {isSubmitting ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>

        <section aria-labelledby="recordHistoryTitle">
          <h2 id="recordHistoryTitle" className={nestForm.nestSectionTitle}>
            최근 기록
          </h2>
          {isLoadingList ? (
            <p className={nestForm.nestMuted}>불러오는 중…</p>
          ) : records.length === 0 ? (
            <p className={nestForm.nestMuted}>아직 저장된 기록이 없어요.</p>
          ) : (
            <ul className={nestForm.nestCommentList}>
              {records.map((r) => {
                const cIdx = r.childIndex ?? 0;
                const displayName = resolveChildLabel(
                  me ?? {},
                  cIdx,
                );
                const metrics = [
                  r.weightKg != null ? `몸무게 ${r.weightKg}kg` : null,
                  r.heightCm != null ? `키 ${r.heightCm}cm` : null,
                  r.headCircumferenceCm != null
                    ? `머리둘레 ${r.headCircumferenceCm}cm`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li
                    key={r.id}
                    className={`${nestForm.nestCommentItem} ${nestForm.nestRecordHistoryItem}`}
                    data-index={String(cIdx % 5)}
                  >
                    <p className={nestForm.nestCommentMeta}>
                      <span className={nestForm.nestRecordHistoryChildName}>
                        {displayName}
                      </span>{" "}
                      · {formatDate(r.recordedAt)}
                    </p>
                    {metrics ? (
                      <p
                        className={nestForm.nestCommentBody}
                        style={{ marginBottom: "0.5rem" }}
                      >
                        {metrics}
                      </p>
                    ) : null}
                    {r.dailyNote ? (
                      <p className={nestForm.nestCommentBody}>{r.dailyNote}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
