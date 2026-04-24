"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { readLoginSession } from "@/lib/loginSession";

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

function resolveChildCount(me: MePayload): number {
  const n = me.childCount ?? me.childBirthYears?.length;
  if (n != null && n >= 1) return Math.min(5, n);
  return 1;
}

function resolveChildLabel(me: MePayload, index: number): string {
  const raw = me.childNames?.[index]?.trim();
  if (raw) return raw;
  return `${index + 1}번째 아이`;
}

export default function RecordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [me, setMe] = useState<MePayload | null>(null);
  const [perChild, setPerChild] = useState<PerChildFields[]>([emptyPerChild()]);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const childCount = me ? resolveChildCount(me) : 1;
  const childLabels = me
    ? Array.from({ length: childCount }, (_, i) => resolveChildLabel(me, i))
    : ["1번째 아이"];
  const showTabs = childCount >= 2;

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setEmail(session.email);
    let cancelled = false;
    fetch(`/api/me?email=${encodeURIComponent(session.email)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (cancelled) return;
        const meData = data as MePayload;
        setMe(meData);
        const n = resolveChildCount(meData);
        setPerChild(Array.from({ length: n }, () => emptyPerChild()));
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function setChildField(index: number, field: keyof PerChildFields, value: string) {
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

    const p = perChild[activeChildIndex] ?? emptyPerChild();

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/baby-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorEmail: email,
          records: [{
            childIndex: activeChildIndex,
            weightKg: p.weightKg.trim() === "" ? null : p.weightKg,
            heightCm: p.heightCm.trim() === "" ? null : p.heightCm,
            headCircumferenceCm: p.headCm.trim() === "" ? null : p.headCm,
            dailyNote: p.dailyNote,
          }],
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "저장에 실패했습니다.");
        return;
      }
      /* 저장과 동시에 아이 기록 목록으로 보낸다(상세 id URL 은 거치지 않음). */
      router.push("/baby-records");
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

  const p = perChild[activeChildIndex] ?? emptyPerChild();

  return (
    <main className={nestForm.nestPage}>
      <div className={nestForm.nestStack}>
        <div>
          <h1 className={nestForm.nestTitle}>아이기록</h1>
          {/*
            nestLead: 목록·폼 상단에서 쓰는 nestForm 공통 보조 문구 톤으로, 제목 바로 아래 입력 목적만 짧게 적는다.
          */}
          <p className={nestForm.nestLead}>우리아이의 성장 기록을 입력하세요.</p>
        </div>

        {/* 아이 탭 — 2명 이상일 때만 표시 */}
        {showTabs && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {childLabels.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveChildIndex(i);
                  setError("");
                  setSuccess("");
                }}
                style={{
                  padding: "0.4rem 1.1rem",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: activeChildIndex === i ? "#5c4033" : "rgba(45,41,38,0.14)",
                  background: activeChildIndex === i ? "#5c4033" : "#fff",
                  color: activeChildIndex === i ? "#fffaf5" : "#5c4033",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className={nestForm.nestForm}>
          <div
            className={nestForm.nestRecordChildSection}
            data-index={String(activeChildIndex % 5)}
          >
            {!showTabs && (
              <p className={nestForm.nestRecordChildName}>
                {childLabels[activeChildIndex] ?? `${activeChildIndex + 1}번째 아이`}
              </p>
            )}
            <div>
              <label htmlFor="recordWeight" className={nestForm.nestLabel}>
                몸무게 (kg)
              </label>
              <input
                id="recordWeight"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={p.weightKg}
                onChange={(e) => setChildField(activeChildIndex, "weightKg", e.target.value)}
                className={nestForm.nestInput}
                placeholder="예: 8.25"
              />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <label htmlFor="recordHeight" className={nestForm.nestLabel}>
                키 (cm)
              </label>
              <input
                id="recordHeight"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={p.heightCm}
                onChange={(e) => setChildField(activeChildIndex, "heightCm", e.target.value)}
                className={nestForm.nestInput}
                placeholder="예: 68.5"
              />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <label htmlFor="recordHead" className={nestForm.nestLabel}>
                머리둘레 (cm)
              </label>
              <input
                id="recordHead"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={p.headCm}
                onChange={(e) => setChildField(activeChildIndex, "headCm", e.target.value)}
                className={nestForm.nestInput}
                placeholder="예: 42.0"
              />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <label htmlFor="recordDaily" className={nestForm.nestLabel}>
                {childLabels[activeChildIndex] ?? "아이"}의 일상
              </label>
              <textarea
                id="recordDaily"
                rows={4}
                value={p.dailyNote}
                onChange={(e) => setChildField(activeChildIndex, "dailyNote", e.target.value)}
                className={`${nestForm.nestTextarea} ${nestForm.nestTextareaGrow}`}
                placeholder="잠·수유·놀이·기분 등 오늘 느낀 점을 자유롭게 적어 주세요."
              />
            </div>
          </div>

          {error ? <p className={nestForm.nestError}>{error}</p> : null}
          {success ? <p className={nestForm.nestSuccess}>{success}</p> : null}

          <div className={nestForm.nestActions}>
            <Link href="/" className={`${nestForm.nestBtnSecondary} ${nestForm.flex1}`}>
              육아박사
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
      </div>
    </main>
  );
}
