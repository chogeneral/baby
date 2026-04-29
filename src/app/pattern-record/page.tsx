"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import nestForm from "@/app/nestForm.module.css";
import { readLoginSession } from "@/lib/loginSession";
import {
  PatternRecordKindChips,
  type PatternRecordKindChipsProps,
} from "@/components/PatternRecordKindChips";
import { writePatternRecordActiveChildIndex } from "@/lib/patternRecordActiveChild";

type MePayload = {
  childCount?: number;
  childNames?: string[];
  childBirthYears?: number[];
};

/**
 * `baby-records`·`/record` 와 동일: 마이의 자녀 수(최대 5)를 쓴다.
 */
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

/**
 * 패턴 기록 — 로그인 + `/api/me` 로 아이 수·이름을 맞추고, 2인 이상이면 `baby-records` 와 같은 **탭**으로 아이를 구분한다.
 */
export default function PatternRecordPage() {
  const router = useRouter();
  const [me, setMe] = useState<MePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    fetch(`/api/me?email=${encodeURIComponent(session.email)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (cancelled) return;
        setMe(data as MePayload);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * 탭 인덱스를 sessionStorage에만 반영해 Navbar 의 칩이 `loadPatternLogs` 전체가 아니라
   * 현재 고른 아이(childIndex)와 같은 로그만 보게 한다(새로고침 후에도 목록과 불일치 방지).
   */
  useEffect(() => {
    writePatternRecordActiveChildIndex(activeTab);
  }, [activeTab]);

  if (isLoading) {
    return (
      <main className={`${nestForm.nestPage} ${nestForm.nestPagePatternRecord}`}>
        <p className={nestForm.nestMessage}>불러오는 중…</p>
      </main>
    );
  }

  const childCount = me ? resolveChildCount(me) : 1;
  const childLabels = Array.from({ length: childCount }, (_, i) =>
    resolveChildLabel(me ?? {}, i),
  );
  const showTabs = childCount >= 2;
  // IDE가 칩 props 타입을 확실히 따라가도록 `MePayload` 반영 뒤 한 번에 묶는다(실행 동작은 동일).
  const patternKindChipsProps: PatternRecordKindChipsProps = {
    activeChildIndex: activeTab,
    childLabels,
    showChildTabs: showTabs,
  };

  return (
    <main className={`${nestForm.nestPage} ${nestForm.nestPagePatternRecord}`}>
      <div className={nestForm.nestStack}>
        <h1 className={nestForm.nestTitle}>패턴 기록</h1>

        <p className={nestForm.nestLead}>
          수면·수유·기상 등 아이의 시간 흐름을 여기에 남길 수 있어요. 자녀가 여럿이면 아래에서 아이를
          골라 각각 기록을 볼 수 있어요.
        </p>

        {showTabs ? (
          <div
            role="tablist"
            aria-label="기준 아이"
            /* 리드 문단과 아이 이름 탭 사이 간격 */
            style={{ margin: "1rem 0 0", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
          >
            {childLabels.map((label, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                id={`pattern-tab-${i}`}
                aria-selected={activeTab === i}
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
                  transition:
                    "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          role={showTabs ? "tabpanel" : undefined}
          id={showTabs ? `pattern-panel-${activeTab}` : undefined}
          aria-labelledby={showTabs ? `pattern-tab-${activeTab}` : undefined}
        >
          <PatternRecordKindChips {...patternKindChipsProps} />
        </div>
      </div>
    </main>
  );
}
