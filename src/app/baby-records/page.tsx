"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import nestForm from "@/app/nestForm.module.css";
import { readLoginSession } from "@/lib/loginSession";
import type { BabyRecord } from "@/lib/babyRecordStore";

type MePayload = {
  childCount?: number;
  childNames?: string[];
  childBirthYears?: number[];
};

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

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-");
  return `${y}.${m}.${d}`;
}

/**
 * `recordedAt.slice(0, 10)`는 ISO 문자열의 **UTC** 날짜만 잘라 쓰므로(예: KST 자정~오전9시는 전날 UTC),
 * 아래 `formatKoreanYmdTime`(로컬)과 날짜가 하루씩 어긋난다. 섹션 제목과 본문을 맞추기 위해
 * 브라우저 **로컬 달력** 기준 YYYY-MM-DD로 묶는다.
 */
function localDateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 아기 성장·일상 저장 시각(recordedAt, ISO)을
 * '2026년 4월 23일 오전 9:30' 형태로 — 연·월·일과 시·분을 한 줄에 표시해
 * 날짜 그룹 제목(같은 날 섹션) 밖에서도 기록일을 바로 읽을 수 있게 한다.
 */
function formatKoreanYmdTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function BabyRecordsPage() {
  const router = useRouter();
  const [me, setMe] = useState<MePayload | null>(null);
  const [records, setRecords] = useState<BabyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch(`/api/me?email=${encodeURIComponent(session.email)}`).then((r) =>
        r.ok ? r.json() : {}
      ),
      fetch(`/api/baby-records?authorEmail=${encodeURIComponent(session.email)}`).then(
        (r) => (r.ok ? r.json() : [])
      ),
    ]).then(([meData, recordsData]) => {
      if (cancelled) return;
      setMe(meData as MePayload);
      setRecords(recordsData as BabyRecord[]);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isLoading) {
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMessage}>불러오는 중…</p>
      </main>
    );
  }

  const childCount = me ? resolveChildCount(me) : 1;
  const childLabels = Array.from({ length: childCount }, (_, i) =>
    resolveChildLabel(me ?? {}, i)
  );
  const showTabs = childCount >= 2;

  const filteredRecords = records.filter(
    (r) => (r.childIndex ?? 0) === activeTab
  );

  const grouped = filteredRecords.reduce<Record<string, BabyRecord[]>>(
    (acc, r) => {
      const key = localDateKeyFromIso(r.recordedAt) || r.recordedAt.slice(0, 10);
      acc[key] = [...(acc[key] ?? []), r];
      return acc;
    },
    {}
  );
  const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <main className={nestForm.nestPage}>
      <div className={nestForm.nestStack}>
        <div>
          <h1 className={nestForm.nestTitle}>아이 기록</h1>
        </div>

        {/* 아이 탭 — 2명 이상일 때만 표시 */}
        {showTabs && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {childLabels.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                style={{
                  padding: "0.4rem 1.1rem",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: activeTab === i ? "#5c4033" : "rgba(45,41,38,0.14)",
                  background: activeTab === i ? "#5c4033" : "#fff",
                  color: activeTab === i ? "#fffaf5" : "#5c4033",
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

        {/* 날짜별 기록 목록 */}
        {filteredRecords.length === 0 ? (
          <p className={nestForm.nestMuted}>
            {showTabs
              ? `${childLabels[activeTab]}의 기록이 아직 없어요.`
              : "아직 저장된 기록이 없어요."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {sortedDates.map((dateKey) => (
              <section key={dateKey}>
                <h2
                  style={{
                    margin: "0 0 0.6rem",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#5c4033",
                  }}
                >
                  {formatDateLabel(dateKey)}
                </h2>
                <ul className={nestForm.nestCommentList}>
                  {grouped[dateKey]!.map((r) => {
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
                        data-index={String((r.childIndex ?? 0) % 5)}
                      >
                        <p className={nestForm.nestCommentMeta}>
                          <span className={nestForm.nestRecordHistoryChildName}>
                            {childLabels[r.childIndex ?? 0] ?? "아이"}
                          </span>
                          {" · "}
                          {formatKoreanYmdTime(r.recordedAt)}
                        </p>
                        {metrics && (
                          <p
                            className={nestForm.nestCommentBody}
                            style={{ marginBottom: r.dailyNote ? "0.4rem" : 0 }}
                          >
                            {metrics}
                          </p>
                        )}
                        {r.dailyNote && (
                          <p className={nestForm.nestCommentBody}>{r.dailyNote}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

  
      </div>
    </main>
  );
}
