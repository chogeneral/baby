"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

/**
 * 저장 직후·목록에서 들어올 수 있는 **한 건의 아기 기록** 상세.
 * `authorEmail` 쿼리로 본인 기록인지 API 에서 다시 맞춘다.
 */
export default function BabyRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [me, setMe] = useState<MePayload | null>(null);
  const [record, setRecord] = useState<BabyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch(`/api/me?email=${encodeURIComponent(session.email)}`).then((r) =>
        r.ok ? r.json() : {},
      ),
      fetch(
        `/api/baby-records/${encodeURIComponent(id)}?authorEmail=${encodeURIComponent(session.email)}`,
      ).then((r) => (r.ok ? r.json() : null)),
    ]).then(([meData, rec]) => {
      if (cancelled) return;
      setMe(meData as MePayload);
      if (rec) {
        setRecord(rec as BabyRecord);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (isLoading) {
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMessage}>불러오는 중…</p>
      </main>
    );
  }

  if (notFound || !record) {
    return (
      <main className={nestForm.nestPage}>
        <p className={nestForm.nestMessage}>기록을 찾을 수 없어요.</p>
        <Link className={nestForm.nestBtnSecondary} style={{ marginTop: "1rem", display: "inline-flex" }} href="/baby-records">
          목록으로
        </Link>
      </main>
    );
  }

  const nChild = me ? resolveChildCount(me) : 1;
  const childLabel =
    nChild > 0
      ? resolveChildLabel(me ?? {}, record.childIndex ?? 0)
      : "아이";

  const metrics = [
    record.weightKg != null ? `몸무게 ${record.weightKg}kg` : null,
    record.heightCm != null ? `키 ${record.heightCm}cm` : null,
    record.headCircumferenceCm != null
      ? `머리둘레 ${record.headCircumferenceCm}cm`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className={nestForm.nestPage}>
      <div className={nestForm.nestStack}>
        <h1 className={nestForm.nestTitle}>아이 기록</h1>
        <p className={nestForm.nestCommentMeta} style={{ margin: "0 0 0.5rem" }}>
          <span className={nestForm.nestRecordHistoryChildName}>{childLabel}</span>
          {" · "}
          {formatKoreanYmdTime(record.recordedAt)}
        </p>
        {metrics ? (
          <p className={nestForm.nestCommentBody} style={{ marginBottom: record.dailyNote ? "0.6rem" : 0 }}>
            {metrics}
          </p>
        ) : null}
        {record.dailyNote ? (
          <p className={nestForm.nestCommentBody} style={{ whiteSpace: "pre-wrap" }}>
            {record.dailyNote}
          </p>
        ) : null}

        <div className={nestForm.nestActions} style={{ marginTop: "1.5rem" }}>
          <Link href="/baby-records" className={`${nestForm.nestBtnSecondary} ${nestForm.flex1}`}>
            전체 기록
          </Link>
          <Link href="/record" className={`${nestForm.nestBtnPrimary} ${nestForm.flex1}`}>
            새로 기록
          </Link>
        </div>
      </div>
    </main>
  );
}
