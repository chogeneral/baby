"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "@/components/patternRecordKindChips.module.css";
import {
  dispatchPatternLogAdded,
  dispatchPatternLogDeleted,
  loadPatternLogs,
  PATTERN_LOGS_UPDATED_EVENT,
  savePatternLogs,
  type PatternLogEntry,
} from "@/lib/patternRecordLogStorage";

const ic = styles.chipIcon;

/* `.chip* .chipIcon` 색과 동일 — 목록의 점·라벨에 사용 */
const categoryAccent: Record<string, string> = {
  moyu: "#ec4899",
  bunyu: "#2563eb",
  weaning: "#ea580c",
  diaper: "#a855f7",
  sleep: "#6366f1",
  pumpFeed: "#e11d48",
  pump: "#b91c1c",
  bath: "#06b6d4",
  hospital: "#ef4444",
  temp: "#d97706",
  med: "#16a34a",
  snack: "#ca8a04",
  milk: "#0284c7",
  play: "#059669",
  tummy: "#c026d3",
  other: "#64748b",
};

/** 목록·모달에서 분 단위를 한글로 표시 */
function formatDuration(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

/**
 * 캡처와 같이 `10:25 PM` 형태(영어 12h) — `time` 요소 `title` 에는 `ko-KR` 전체 시각.
 */
function formatTimeEn(d: Date): { hm: string; ap: string } {
  if (Number.isNaN(d.getTime())) {
    return { hm: "—", ap: "" };
  }
  const s = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const m = s.match(/^(\d{1,2}:\d{2})\s*(AM|PM)/i);
  return { hm: m?.[1] ?? s, ap: m?.[2]?.toUpperCase() ?? "" };
}

/**
 * 목록 상단 '오늘' 머리글 — **월·일**과 `ko-KR` **요일 긴 이름**(예: 월요일). 연도는 붙이지 않는다.
 * `dateTime` 은 `YYYY-MM-DD` 로 하루 구간을 기계가 읽을 수 있게 맞춘다.
 */
function todayHeadingParts(d: Date): { line: string; dateAttr: string } {
  if (Number.isNaN(d.getTime())) {
    return { line: "—", dateAttr: "" };
  }
  const y = d.getFullYear();
  const mo = d.getMonth() + 1;
  const day = d.getDate();
  const w = d.toLocaleDateString("ko-KR", { weekday: "long" });
  const dateAttr = `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { line: `${mo}월 ${day}일 ${w}`, dateAttr };
}

/** 모달 시간 패널 큰 시계 — 12h 영문, 시·분 2자리. */
function formatPumpClock12(d: Date): string {
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60000) return "방금 전";
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

/** 요약 바 전용 — 시간+분 정밀 표시. 예) "11시간 45분 전", "22분 전" */
function formatElapsed(atMs: number): string {
  const diff = Date.now() - atMs;
  if (diff < 60000) return "방금 전";
  const totalMin = Math.floor(diff / 60000);
  if (totalMin < 60) return `${totalMin}분 전`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}시간 ${m}분 전` : `${h}시간 전`;
}

/**
 * 둘째 줄 회색 보조(용량/시간 등) — 캡처는 일부 항목만. 없으면 `null` 로 렌더 생략.
 */
function sublineForCategoryId(id: string): string | null {
  switch (id) {
    case "sleep":
      return null;
    default:
      return null;
  }
}

function newLogId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function iconTrash() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden width="22" height="22">
      <path
        d="M7.5 4.5h5M3.5 6.5h13M5.5 6.5l1 9h7l1-9"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 9.5v4M11.5 9.5v4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function listChevron() {
  return (
    <svg
      className={styles.logRowChevron}
      viewBox="0 0 8 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M1.5 1.5L6 6l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 투약 행: 점 대신 캡처처럼 작은 알약 심볼 */
function MedPillIcon({ color }: { color: string }) {
  return (
    <svg className={styles.logRowMedIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4.2"
        y="4.2"
        width="15.6"
        height="15.6"
        rx="4"
        transform="rotate(45 12 12)"
        stroke={color}
        strokeWidth="1.75"
      />
      <path d="M8 12h8" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function iconMoyu() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5C10 6.5 7 8.2 7 12.5a5 5 0 1 0 10 0c0-4.3-3-5.5-5-9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </svg>
  );
}

function iconBunyu() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 5h10a2 2 0 0 1 2 2v1.2a1 1 0 0 0 .4.8l.5.3a2.5 2.5 0 0 1 1.1 2.1V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.4a2.5 2.5 0 0 1 1.1-2.1l.5-.3a1 1 0 0 0 .4-.8V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M8 9h.01M10 9h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function iconWeaning() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 11c.5-3.2 2.4-4 4-4h6c1.6 0 3.5.8 4 4M4 12h16v.5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconDiaper() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4h8v3a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V4ZM7 6H5.5A2.5 2.5 0 0 0 3 8.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5A2.5 2.5 0 0 0 18.5 6H17M9 20v-2M15 20v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconSleep() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 14.5A7.5 7.5 0 0 1 5.2 5.2 7.5 7.5 0 0 0 14.5 20 7.5 7.5 0 0 0 20 18.8v-4.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconPumpFeed() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="7" width="5" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 10h2.2a1.3 1.3 0 0 1 1.2.8L14 12M14 5v3M16 7h2.5A2.5 2.5 0 0 1 21 9.5V19a1 1 0 0 0 1 1M13 5c0-1.1.9-2 2-2h1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function iconPump() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="7" width="7" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 9h2.2a1.2 1.2 0 0 1 1.1.7L16 12M12 4v1.5M16 3v1M18.5 8a2.5 2.5 0 0 1 0 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function iconBath() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12h16v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1ZM4 12V9a1 1 0 0 1 1-1M8 5c0 1.2.9 2 2 2M20 8a1 1 0 0 1 1 1v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconHospital() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v6M9 10h6M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function iconTemp() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 2v12.2a4 4 0 1 0 4 0V2H10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

function iconMed() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4.2"
        y="4.2"
        width="15.6"
        height="15.6"
        rx="4"
        transform="rotate(45 12 12)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function iconSnack() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="7" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconMilk() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 3h8l-1.2 3H9.2L8 3ZM7.2 6h9.6l.8 1.2c.2.3.1.5-.1.7L16 8.2V20a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8.2L6.5 8c-.2-.2-.3-.4-.1-.7L7.2 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconPlay() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 8.2c0-.8.5-1.1 1.1-.6l5.8 3.3c.6.3.6 1 0 1.4L9.1 16c-.6.3-1.1 0-1.1-.7V8.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function iconTummy() {
  return (
    <svg className={ic} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6M4 18h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Item = {
  id: string;
  label: string;
  chipClass: string;
  /** 기타는 텍스트만 보이게 아이콘 없음(··· SVG 는 제거). */
  icon?: () => ReactNode;
};

const items: Item[] = [
  { id: "moyu", label: "모유", chipClass: styles.chipMoyu, icon: iconMoyu },
  { id: "bunyu", label: "분유", chipClass: styles.chipBunyu, icon: iconBunyu },
  { id: "weaning", label: "이유식", chipClass: styles.chipWeaning, icon: iconWeaning },
  { id: "diaper", label: "기저귀", chipClass: styles.chipDiaper, icon: iconDiaper },
  { id: "sleep", label: "수면", chipClass: styles.chipSleep, icon: iconSleep },
  { id: "pumpFeed", label: "유축수유", chipClass: styles.chipPumpFeed, icon: iconPumpFeed },
  { id: "pump", label: "유축", chipClass: styles.chipPump, icon: iconPump },
  { id: "bath", label: "목욕", chipClass: styles.chipBath, icon: iconBath },
  { id: "hospital", label: "병원", chipClass: styles.chipHospital, icon: iconHospital },
  { id: "temp", label: "체온", chipClass: styles.chipTemp, icon: iconTemp },
  { id: "med", label: "투약", chipClass: styles.chipMed, icon: iconMed },
  { id: "snack", label: "간식", chipClass: styles.chipSnack, icon: iconSnack },
  { id: "milk", label: "우유", chipClass: styles.chipMilk, icon: iconMilk },
  { id: "play", label: "놀이", chipClass: styles.chipPlay, icon: iconPlay },
  { id: "tummy", label: "터미타임", chipClass: styles.chipTummy, icon: iconTummy },
];

export type PatternRecordKindChipsProps = {
  /** `baby-records` 의 `activeTab` 과 동일 — 몇 번째 아이(0~)에 쌓을지. */
  activeChildIndex: number;
  childLabels: string[];
  /** 자녀 2인 이상일 때만 탭이 있고, 빈 목록 문구에 이름을 쓴다. */
  showChildTabs: boolean;
};

/**
 * 서브텍스트 아래 x스크롤 칩 + 클릭 시 `childIndex` 포함해 `localStorage` 저장·타임로그.
 * `activeChildIndex`에 맞는 로그만 목록에 표시(아이기록과 동일한 탭 모델).
 */
export function PatternRecordKindChips({
  activeChildIndex,
  childLabels,
  showChildTabs,
}: PatternRecordKindChipsProps) {
  const [logs, setLogs] = useState<PatternLogEntry[]>([]);
  const [editingLog, setEditingLog] = useState<PatternLogEntry | null>(null);
  const [editMemo, setEditMemo] = useState("");
  const [editBreast, setEditBreast] = useState<"left" | "right" | "both" | undefined>(undefined);
  const [editDurationMin, setEditDurationMin] = useState(0);
  const [editMlAmount, setEditMlAmount] = useState(0);
  const [editWeaningType, setEditWeaningType] = useState("");
  const [editDiaperType, setEditDiaperType] = useState<"pee" | "poo" | "both" | undefined>(undefined);
  /** 수면 전용: 캡처 UI처럼 밤잠/낮잠 중 하나만 선택(저장 시 `sleepType`으로 반영). */
  const [editSleepType, setEditSleepType] = useState<"night" | "nap">("nap");
  const [editSleepHour, setEditSleepHour] = useState(0);
  const [editSleepMinStep, setEditSleepMinStep] = useState(0);
  const [editPumpMlLeft, setEditPumpMlLeft] = useState(0);
  const [editPumpMlRight, setEditPumpMlRight] = useState(0);
  const [editHospitalType, setEditHospitalType] = useState<"checkup" | "illness" | undefined>(undefined);
  const [editHospitalName, setEditHospitalName] = useState("");
  const [editHospitalDoctor, setEditHospitalDoctor] = useState("");
  const [editHospitalNote, setEditHospitalNote] = useState("");
  const [editTempC, setEditTempC] = useState(37.0);
  const [editMedName, setEditMedName] = useState("");
  const [editSnackName, setEditSnackName] = useState("");
  const [editSnackAmount, setEditSnackAmount] = useState(0);
  const [editSnackUnit, setEditSnackUnit] = useState<"ml" | "g">("ml");
  const [editPlayName, setEditPlayName] = useState("");
  const [editPlayReaction, setEditPlayReaction] = useState<"like" | "less-interest" | undefined>(undefined);
  /**
   * 전체 모달 공통 시간 패널: 열 때 기록 시각(앵커) + 슬라이더/−1h 로 시간(h) 보정.
   * 가운데 큰 시계 = 앵커 + 오프셋(편집 중인 기록 시각).
   */
  const [timePanelAnchorAtMs, setTimePanelAnchorAtMs] = useState(0);
  const [timePanelHourOffset, setTimePanelHourOffset] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = loadPatternLogs();
    s.sort((a, b) => b.atMs - a.atMs);
    setLogs(s);
  }, []);

  /*
   * Navbar 에서 pullPatternLogsForSession 이 끝나면 savePatternLogs 가 이 이벤트를 쏜다.
   * 패턴 기록 화면이 이미 열려 있을 때 목록·요약 바가 서버 데이터와 맞도록 로컬을 다시 읽는다.
   */
  useEffect(() => {
    const onUpdated = () => {
      const s = loadPatternLogs();
      s.sort((a, b) => b.atMs - a.atMs);
      setLogs(s);
    };
    window.addEventListener(PATTERN_LOGS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(PATTERN_LOGS_UPDATED_EVENT, onUpdated);
  }, []);

  // 모달 열기
  const openEdit = useCallback((log: PatternLogEntry) => {
    setEditMemo(log.memo ?? "");
    setEditBreast(log.breast);
    setEditDurationMin(log.durationMin ?? 0);
    setEditMlAmount(log.mlAmount ?? 0);
    setEditWeaningType(log.weaningType ?? "");
    setEditDiaperType(log.diaperType);
    setEditSleepType(log.sleepType ?? "nap");
    const existingDuration = log.durationMin ?? 0;
    if (log.categoryId === "bath" || log.categoryId === "pump" || log.categoryId === "tummy") {
      setEditSleepHour(0);
      setEditSleepMinStep(Math.min(6, Math.round(existingDuration / 10)));
    } else {
      setEditSleepHour(Math.min(5, Math.floor(existingDuration / 60)));
      setEditSleepMinStep(Math.min(6, Math.round((existingDuration % 60) / 10)));
    }
    if (log.categoryId === "pump") {
      setEditPumpMlLeft(log.pumpMlLeft ?? 0);
      setEditPumpMlRight(log.pumpMlRight ?? 0);
    }
    if (log.categoryId === "hospital") {
      setEditHospitalType(log.hospitalType);
      setEditHospitalName(log.hospitalName ?? "");
      setEditHospitalDoctor(log.hospitalDoctor ?? "");
      setEditHospitalNote(log.hospitalNote ?? "");
    }
    if (log.categoryId === "temp") {
      setEditTempC(log.tempC ?? 37.0);
    }
    if (log.categoryId === "med") {
      setEditMedName(log.medName ?? "");
    }
    if (log.categoryId === "snack") {
      setEditSnackName(log.snackName ?? "");
      setEditSnackAmount(log.snackAmount ?? 0);
      setEditSnackUnit(log.snackUnit ?? "ml");
    }
    if (log.categoryId === "play") {
      setEditPlayName(log.playName ?? "");
      setEditPlayReaction(log.playReaction);
    }
    setTimePanelAnchorAtMs(log.atMs);
    setTimePanelHourOffset(0);
    setEditingLog(log);
  }, []);

  // 모달 닫기
  const cancelEdit = useCallback(() => {
    setEditingLog(null);
  }, []);

  // 시간 저장 — 공통 시간 패널(앵커 + 시간 오프셋)으로 atMs 확정
  const saveEdit = useCallback(() => {
    if (!editingLog) return;
    const trimmedMemo = editMemo.trim();
    const isPump = editingLog.categoryId === "pump";
    const isHospital = editingLog.categoryId === "hospital";
    const atMsSaved = timePanelAnchorAtMs + timePanelHourOffset * 3600000;
    const isBreast = editingLog.categoryId === "moyu" || editingLog.categoryId === "pumpFeed" || isPump;
    const isBunyu = editingLog.categoryId === "bunyu";
    const isWeaning = editingLog.categoryId === "weaning";
    const isDiaper = editingLog.categoryId === "diaper";
    const isSleep = editingLog.categoryId === "sleep";
    const isPumpFeed = editingLog.categoryId === "pumpFeed";
    const isMilk = editingLog.categoryId === "milk";
    const hasAmountTrack = isBunyu || isWeaning || isPumpFeed || isPump || isMilk;
    setLogs((prev) => {
      const next = prev.map((l) =>
        l.logId === editingLog.logId
          ? {
              ...l,
              atMs: atMsSaved,
              memo: trimmedMemo || undefined,
              breast: isBreast ? editBreast : undefined,
              durationMin:
                editingLog.categoryId === "moyu" && editDurationMin > 0
                  ? editDurationMin
                  : isSleep
                  ? editSleepHour * 60 + editSleepMinStep * 10
                  : (editingLog.categoryId === "bath" || editingLog.categoryId === "tummy" || isPump) && editSleepMinStep > 0
                  ? editSleepMinStep * 10
                  : undefined,
              mlAmount: hasAmountTrack && editMlAmount > 0 ? editMlAmount : undefined,
              pumpMlLeft: undefined,
              pumpMlRight: undefined,
              weaningType: isWeaning ? (editWeaningType.trim() || undefined) : undefined,
              diaperType: isDiaper ? editDiaperType : undefined,
              sleepType: isSleep ? editSleepType : undefined,
              hospitalType: isHospital ? editHospitalType : undefined,
              hospitalName: isHospital && editHospitalName.trim() ? editHospitalName.trim() : undefined,
              hospitalDoctor: isHospital && editHospitalDoctor.trim() ? editHospitalDoctor.trim() : undefined,
              hospitalNote: isHospital && editHospitalNote.trim() ? editHospitalNote.trim() : undefined,
              tempC: editingLog.categoryId === "temp" ? editTempC : undefined,
              medName: editingLog.categoryId === "med" && editMedName.trim() ? editMedName.trim() : undefined,
              snackName: editingLog.categoryId === "snack" && editSnackName.trim() ? editSnackName.trim() : undefined,
              snackAmount: editingLog.categoryId === "snack" && editSnackAmount > 0 ? editSnackAmount : undefined,
              snackUnit: editingLog.categoryId === "snack" ? editSnackUnit : undefined,
              playName: editingLog.categoryId === "play" && editPlayName.trim() ? editPlayName.trim() : undefined,
              playReaction: editingLog.categoryId === "play" ? editPlayReaction : undefined,
            }
          : l,
      );
      savePatternLogs(next);
      return next;
    });
    setEditingLog(null);
  }, [
    editingLog,
    editMemo,
    editBreast,
    editDurationMin,
    editMlAmount,
    editWeaningType,
    editDiaperType,
    editSleepType,
    editSleepHour,
    editSleepMinStep,
    editHospitalType,
    editHospitalName,
    editHospitalDoctor,
    editHospitalNote,
    editTempC,
    editMedName,
    editSnackName,
    editSnackAmount,
    editSnackUnit,
    editPlayName,
    editPlayReaction,
    timePanelAnchorAtMs,
    timePanelHourOffset,
  ]);

  // Escape 키로 수정 모달 닫기
  useEffect(() => {
    if (!editingLog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingLog, cancelEdit]);

  // 가슴 선택 토글 (같은 쪽 재클릭 시 해제, 반대쪽 선택 시 both)
  const toggleBreast = useCallback((side: "left" | "right") => {
    setEditBreast((prev) => {
      if (prev === side) return undefined;
      if (prev !== undefined && prev !== side) return "both";
      return side;
    });
  }, []);

  const deleteLog = useCallback((logId: string) => {
    // logs를 직접 참조해 콜백 밖에서 처리 — savePatternLogs(UPDATED)와 dispatchPatternLogDeleted(DELETED) 순서 충돌 방지
    const deleted = logs.find((l) => l.logId === logId);
    const next = logs.filter((l) => l.logId !== logId);
    savePatternLogs(next);
    setLogs(next);
    if (deleted) dispatchPatternLogDeleted({ categoryId: deleted.categoryId });
  }, [logs]);

  const onChip = useCallback(
    (categoryId: string, label: string) => {
      const atMs = Date.now();
      setLogs((prev) => {
        const next: PatternLogEntry[] = [
          {
            logId: newLogId(),
            categoryId,
            label,
            atMs,
            childIndex: activeChildIndex,
            /* 새 수면 기록은 캡처 UI 기본값과 같이 ‘낮잠’으로 시작(목록·저장 모두 일관). */
            ...(categoryId === "sleep" ? { sleepType: "nap" as const } : {}),
          },
          ...prev,
        ];
        savePatternLogs(next);
        return next;
      });
      dispatchPatternLogAdded({ categoryId, atMs, childIndex: activeChildIndex });
    },
    [activeChildIndex],
  );

  const visibleLogs = logs
    .filter((r) => (r.childIndex ?? 0) === activeChildIndex)
    .sort((a, b) => b.atMs - a.atMs);

  const todayInfo = todayHeadingParts(new Date());

  // 요약 바 — visibleLogs 는 이미 시간 내림차순이므로 첫 번째가 가장 최근
  const lastDiaper = visibleLogs.find((l) => l.categoryId === "diaper") ?? null;
  const lastFeed = visibleLogs.find((l) => l.categoryId === "moyu" || l.categoryId === "pumpFeed") ?? null;
  const lastBunyu = visibleLogs.find((l) => l.categoryId === "bunyu" || l.categoryId === "milk") ?? null;
  const lastSleep = visibleLogs.find((l) => l.categoryId === "sleep") ?? null;

  return (
    <div>
      <div className={styles.chipRowWrap} role="group" aria-label="기록할 패턴 종류">
        <div className={styles.chipScroll}>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`${styles.chip} ${it.chipClass}`}
              title={it.label}
              onClick={() => onChip(it.id, it.label)}
            >
              {it.icon?.()}
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 마지막 기저귀·수유·잠 요약 바 */}
      {mounted && (
        <div className={styles.lastSummaryBar}>
          {/* 마지막 기저귀 */}
          <div className={styles.lastSummaryCard}>
            <span className={styles.lastSummaryTitle}>마지막 기저귀</span>
            {lastDiaper ? (
              <>
                <span className={styles.lastSummaryTime}>{formatElapsed(lastDiaper.atMs)}</span>
                {lastDiaper.diaperType ? (
                  <span className={styles.lastSummarySubLabel}>
                    {lastDiaper.diaperType === "pee" ? "소변" : lastDiaper.diaperType === "poo" ? "대변" : "둘다"}
                  </span>
                ) : null}
              </>
            ) : (
              <span className={styles.lastSummaryNone}>기록 없음</span>
            )}
          </div>

          {/* 마지막 수유(모유+분유) */}
          <div className={styles.lastSummaryCard}>
            <span className={styles.lastSummaryTitle}>마지막 수유</span>
            {lastFeed ? (
              <div className={styles.lastSummaryFeedRow}>
                <span
                  className={styles.lastSummaryFeedDot}
                  style={{ backgroundColor: categoryAccent.moyu }}
                />
                <span className={styles.lastSummaryTime}>{formatElapsed(lastFeed.atMs)}</span>
              </div>
            ) : null}
            {lastBunyu ? (
              <div className={styles.lastSummaryFeedRow}>
                <span
                  className={styles.lastSummaryFeedDot}
                  style={{ backgroundColor: categoryAccent.bunyu }}
                />
                <span className={styles.lastSummaryTime}>{formatElapsed(lastBunyu.atMs)}</span>
              </div>
            ) : null}
            {!lastFeed && !lastBunyu ? (
              <span className={styles.lastSummaryNone}>기록 없음</span>
            ) : null}
          </div>

          {/* 마지막 잠 */}
          <div className={styles.lastSummaryCard}>
            <span className={styles.lastSummaryTitle}>마지막 잠</span>
            {lastSleep ? (
              <>
                <span className={styles.lastSummaryTime}>{formatElapsed(lastSleep.atMs)}</span>
                {lastSleep.sleepType ? (
                  <span className={styles.lastSummarySubLabel}>
                    {lastSleep.sleepType === "night" ? "밤잠" : "낮잠"}
                  </span>
                ) : null}
              </>
            ) : (
              <span className={styles.lastSummaryNone}>기록 없음</span>
            )}
          </div>
        </div>
      )}

      {/* 날짜(월·일·요일)는 흰 로그 패널 밖·페이지 베이지 위에 둔다(아이기록 날짜 머리와 같은 역할). */}
      <div className={styles.logTodayHeaderRow}>
        <h2 className={styles.logTodayHeader}>
          <time dateTime={todayInfo.dateAttr || undefined}>{todayInfo.line}</time>
        </h2>
      </div>

      <div
        className={styles.logPanel}
        aria-live="polite"
        aria-atomic="false"
      >
        {visibleLogs.length === 0 ? (
          <p className={styles.logEmpty}>
            {showChildTabs
              ? `${childLabels[activeChildIndex] ?? "이 아이"}의 패턴 기록이 아직 없어요. 위 칩을 누르면 선택한 아이 이름으로 쌓여요(브라우저에만 저장).`
              : "위 칩을 누르면 그때의 시각으로 기록이 쌓여요"}
          </p>
        ) : (
          <ul className={styles.logList}>
            {visibleLogs.map((row) => {
              const d = new Date(row.atMs);
              const { hm, ap } = formatTimeEn(d);
              const accent = categoryAccent[row.categoryId] ?? categoryAccent.other!;
              const sub = sublineForCategoryId(row.categoryId);
              return (
                <li
                  key={row.logId}
                  className={styles.logRow}
                  role="button"
                  tabIndex={0}
                  aria-label={`${row.label} ${hm} ${ap} 시간 수정`}
                  onClick={() => openEdit(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openEdit(row);
                  }}
                >
                  <time
                    className={styles.logTime}
                    dateTime={d.toISOString()}
                    title={d.toLocaleString("ko-KR")}
                  >
                    <span className={styles.logTimeMain}>{hm}</span>
                    {ap ? <span className={styles.logTimePeriod}>{` ${ap}`}</span> : null}
                    {row.categoryId === "sleep" && row.durationMin != null && row.durationMin > 0 ? (
                      (() => {
                        const wake = formatTimeEn(new Date(row.atMs + row.durationMin * 60000));
                        return (
                          <span className={styles.logTimeWake}>
                            {`~ ${wake.hm} ${wake.ap}`}
                          </span>
                        );
                      })()
                    ) : null}
                  </time>
                  <div className={styles.logMain}>
                    <div className={styles.logTitleLine}>
                      {row.categoryId === "med" ? (
                        <MedPillIcon color={accent} />
                      ) : (
                        <span
                          className={styles.logDot}
                          style={{ backgroundColor: accent }}
                          aria-hidden
                        />
                      )}
                      <span className={styles.logLabel} style={{ color: accent }}>
                        {row.label}
                      </span>
                    </div>
                    {sub ? <p className={styles.logSub}>{sub}</p> : null}
                    {(row.breast ||
                      (row.durationMin != null && row.durationMin > 0) ||
                      (row.mlAmount != null && row.mlAmount > 0) ||
                      (row.pumpMlLeft != null && row.pumpMlLeft > 0) ||
                      (row.pumpMlRight != null && row.pumpMlRight > 0) ||
                      row.weaningType ||
                      row.diaperType ||
                      row.sleepType ||
                      row.hospitalType ||
                      row.hospitalName ||
                      row.hospitalNote ||
                      row.tempC != null ||
                      row.medName ||
                      row.snackName ||
                      row.snackAmount != null ||
                      row.playName ||
                      row.playReaction) ? (
                      <div className={styles.logBreastRow}>
                        {row.breast ? (
                          <span className={styles.logBreastTag}>
                            {row.breast === "left" ? "왼쪽 가슴" : row.breast === "right" ? "오른쪽 가슴" : "양쪽 가슴"}
                          </span>
                        ) : null}
                        {row.durationMin != null && row.durationMin > 0 ? (
                          <span className={styles.logBreastTag}>
                            {formatDuration(row.durationMin)}
                          </span>
                        ) : null}
                        {row.weaningType ? (
                          <span className={styles.logWeaningTag}>{row.weaningType}</span>
                        ) : null}
                        {row.mlAmount != null && row.mlAmount > 0 ? (
                          <span className={styles.logMlTag}>
                            {row.mlAmount} {row.categoryId === "weaning" ? "g" : "ml"}
                          </span>
                        ) : null}
                        {row.pumpMlLeft != null && row.pumpMlLeft > 0 ? (
                          <span className={styles.logMlTag}>왼쪽 {row.pumpMlLeft}ml</span>
                        ) : null}
                        {row.pumpMlRight != null && row.pumpMlRight > 0 ? (
                          <span className={styles.logMlTag}>오른쪽 {row.pumpMlRight}ml</span>
                        ) : null}
                        {row.diaperType ? (
                          <span className={styles.logDiaperTag}>
                            {row.diaperType === "pee" ? "소변" : row.diaperType === "poo" ? "대변" : "둘다"}
                          </span>
                        ) : null}
                        {row.sleepType ? (
                          <span className={styles.logSleepTag}>
                            {row.sleepType === "night" ? "밤잠" : "낮잠"}
                          </span>
                        ) : null}
                        {row.hospitalType ? (
                          <span className={styles.logHospitalTypeTag}>
                            {row.hospitalType === "checkup" ? "검진" : "질환"}
                          </span>
                        ) : null}
                        {row.hospitalName ? (
                          <span className={styles.logHospitalNameTag}>{row.hospitalName}</span>
                        ) : null}
                        {row.hospitalNote ? (
                          <span className={styles.logHospitalNameTag}>{row.hospitalNote}</span>
                        ) : null}
                        {row.tempC != null ? (
                          <span className={styles.logTempTag}>{row.tempC.toFixed(1)}°C</span>
                        ) : null}
                        {row.medName ? (
                          <span className={styles.logMedNameTag}>{row.medName}</span>
                        ) : null}
                        {row.snackName ? (
                          <span className={styles.logSnackTag}>{row.snackName}</span>
                        ) : null}
                        {row.snackAmount != null && row.snackAmount > 0 ? (
                          <span className={styles.logSnackTag}>{row.snackAmount}{row.snackUnit ?? "ml"}</span>
                        ) : null}
                        {row.playName ? (
                          <span className={styles.logPlayTag}>{row.playName}</span>
                        ) : null}
                        {row.playReaction ? (
                          <span className={styles.logPlayTag}>
                            {row.playReaction === "like" ? "좋아함" : "관심적음"}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {row.memo ? <p className={styles.logMemo}>{row.memo}</p> : null}
                  </div>
                  <button
                    type="button"
                    className={styles.logDeleteBtn}
                    aria-label={`${row.label} 기록 삭제`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLog(row.logId);
                    }}
                  >
                    {iconTrash()}
                  </button>
                  <span className={styles.logChevWrap} aria-hidden>
                    {listChevron()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 시간 수정 모달 — transform 조상의 stacking context를 벗어나기 위해 body에 portal로 마운트 */}
      {mounted && editingLog
        ? createPortal(
            <div
              className={styles.timeEditOverlay}
              role="dialog"
              aria-modal="true"
              aria-labelledby="time-edit-title"
              onClick={(e) => {
                if (e.target === e.currentTarget) cancelEdit();
              }}
            >
              <div className={styles.timeEditModal}>
                <div className={styles.timeEditHeader}>
                  <p className={styles.timeEditSubLabel} id="time-edit-title">
                    {editingLog.label}
                  </p>
                </div>

                {/*
                  모든 종류 공통: 큰 시각·~종료·−1h·시간 슬라이더(‘시간’ 라벨 문구는 표시하지 않음).
                  유축만 아래에 구분선+상세 블록이 이어짐.
                */}
                <div className={styles.pumpTimePanel}>
                  {/*
                    displayMs: 앵커 시각 + 슬라이더/−1h 보정.
                    오른쪽 ~ 시각: 모유·유축 등 분 입력이 있으면 그만큼 더한 종료 시각(없으면 시작과 동일).
                  */}
                  {(() => {
                    const displayMs = timePanelAnchorAtMs + timePanelHourOffset * 3600000;
                    const startD = new Date(displayMs);
                    const endD = editingLog?.categoryId === "sleep"
                      ? new Date()
                      : new Date(displayMs + editDurationMin * 60000);
                    return (
                      <>
                        <div className={styles.pumpTimeRow}>
                          <button
                            type="button"
                            className={styles.pumpTimeMinusHour}
                            onClick={() => setTimePanelHourOffset((o) => Math.max(-4, o - 1))}
                            aria-label="한 시간 앞당기기"
                          >
                            -1h
                          </button>
                          <p className={styles.pumpTimeMain} aria-live="polite">
                            {formatPumpClock12(startD)}
                          </p>
                          <p className={styles.pumpTimeTildeEnd} aria-label="활동 종료 시각">
                            ~ {formatPumpClock12(endD)}
                          </p>
                        </div>
                        <div className={styles.pumpOffsetSliderWrap}>
                          <input
                            type="range"
                            min={-4}
                            max={4}
                            step={1}
                            value={timePanelHourOffset}
                            onChange={(e) => setTimePanelHourOffset(Number(e.target.value))}
                            className={styles.pumpOffsetSlider}
                            aria-label="기록 시각을 시간 단위로 조정(-4~+4시간)"
                          />
                          <div className={styles.pumpOffsetTicks} aria-hidden>
                            {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((n) => (
                              <span key={n}>{n <= 0 ? `${n}` : `+${n}`}</span>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {editingLog.categoryId === "pump" && (
                  <hr className={styles.pumpModalSectionRule} aria-hidden />
                )}

                {/*
                  수면 편집 시에만 표시. 시각 픽커 바로 아래에 두어 ‘수면’ 제목 직후 흐름과 캡처 레이아웃(타입 블록)을 맞춤.
                  선택값은 `editSleepType` → 저장 시 `PatternLogEntry.sleepType` 으로 localStorage 에 반영.
                */}
                {editingLog.categoryId === "sleep" && (
                  <div className={styles.sleepTypeSection}>
                    <div className={styles.sleepTypeHead}>
                      <span className={styles.sleepTypeTitle}>타입</span>
                    </div>
                    <div className={styles.sleepTypeDivider} aria-hidden />
                    <div className={styles.sleepTypeBtnRow} role="group" aria-label="수면 타입">
                      <button
                        type="button"
                        className={`${styles.sleepTypeBtn} ${editSleepType === "night" ? styles.sleepTypeBtnActive : ""}`}
                        onClick={() => setEditSleepType("night")}
                      >
                        밤잠
                      </button>
                      <button
                        type="button"
                        className={`${styles.sleepTypeBtn} ${editSleepType === "nap" ? styles.sleepTypeBtnActive : ""}`}
                        onClick={() => setEditSleepType("nap")}
                      >
                        낮잠
                      </button>
                    </div>
                  </div>
                )}

                {/* 수면 전용 — 얼마 동안 슬라이더(시간 0-5 / 분 0-6단계 × 10) */}
                {editingLog.categoryId === "sleep" && (
                  <div className={styles.sleepDurationSection}>
                    <div className={styles.sleepDurationHeader}>
                      <span className={styles.sleepDurationTitle}>얼마 동안</span>
                      <div className={styles.sleepDurationBtnGroup}>
                        
                        <button
                          type="button"
                          className={styles.sleepDurationNowBtn}
                          onClick={() => {
                            const displayMs =
                              timePanelAnchorAtMs + timePanelHourOffset * 3600000;
                            const elapsedMin = Math.max(0, Math.round((Date.now() - displayMs) / 60000));
                            setEditSleepHour(Math.min(5, Math.floor(elapsedMin / 60)));
                            setEditSleepMinStep(Math.min(6, Math.round((elapsedMin % 60) / 10)));
                          }}
                        >
                          지금 깸
                        </button>
                      </div>
                    </div>
                    <p className={styles.sleepDurationDisplay}>
                      {editSleepHour === 0 && editSleepMinStep === 0
                        ? "0분"
                        : editSleepHour === 0
                        ? `${editSleepMinStep * 10}분`
                        : editSleepMinStep === 0
                        ? `${editSleepHour}시간`
                        : `${editSleepHour}시간 ${editSleepMinStep * 10}분`}
                    </p>
                    <div className={styles.sleepSliderGroup}>
                      <div className={styles.sleepSliderItem}>
                        <span className={styles.sleepSliderLabel}>시간</span>
                        <div className={styles.breastSliderWrap}>
                          <input
                            type="range"
                            min={0}
                            max={5}
                            step={1}
                            value={editSleepHour}
                            onChange={(e) => setEditSleepHour(Number(e.target.value))}
                            className={styles.breastSlider}
                            aria-label="수면 시간(시간 단위)"
                          />
                          <div className={styles.breastSliderTicks}>
                            {[0, 1, 2, 3, 4, 5].map((t) => (
                              <span key={t}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className={styles.sleepSliderItem}>
                        <span className={styles.sleepSliderLabel}>분</span>
                        <div className={styles.breastSliderWrap}>
                          <input
                            type="range"
                            min={0}
                            max={6}
                            step={1}
                            value={editSleepMinStep}
                            onChange={(e) => setEditSleepMinStep(Number(e.target.value))}
                            className={styles.breastSlider}
                            aria-label="수면 시간(분 단위)"
                          />
                          <div className={styles.breastSliderTicks}>
                            {[0, 1, 2, 3, 4, 5, 6].map((t) => (
                              <span key={t}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/*
                  모유: 바로 가슴 선택·큰 분 표시·슬라이더(바깥 ‘얼마 동안’ 제목 문구 없음).
                */}
                {editingLog.categoryId === "moyu" && (
                  <div className={styles.breastSection}>
                    <p className={styles.mlHeadTitle}>얼마동안</p>
                    <div className={styles.breastBtnRow}>
                      <button
                        type="button"
                        className={`${styles.breastBtn} ${editBreast === "left" || editBreast === "both" ? styles.breastBtnActive : ""}`}
                        onClick={() => toggleBreast("left")}
                      >
                        왼쪽 가슴
                      </button>
                      <span className={styles.breastConnector} aria-hidden>◄·······►</span>
                      <button
                        type="button"
                        className={`${styles.breastBtn} ${editBreast === "right" || editBreast === "both" ? styles.breastBtnActive : ""}`}
                        onClick={() => toggleBreast("right")}
                      >
                        오른쪽 가슴
                      </button>
                    </div>

                    <p className={styles.breastDurationDisplay}>{editDurationMin}분</p>

                    <div className={styles.breastSliderWrap}>
                      <input
                        type="range"
                        min={0}
                        max={120}
                        step={1}
                        value={editDurationMin}
                        onChange={(e) => setEditDurationMin(Number(e.target.value))}
                        className={styles.breastSlider}
                        aria-label="수유 시간(분)"
                      />
                      <div className={styles.breastSliderTicks}>
                        {[0, 15, 30, 45, 60, 90, 120].map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 유축 — 얼마 동안(분 단계) + 유축 양(좌우 분리) */}
                {editingLog.categoryId === "pump" && (
                  <>
                    <div className={styles.sleepDurationSection}>
                      <div className={styles.sleepDurationHeader}>
                        <span className={styles.sleepDurationTitle}>얼마 동안</span>
                        <div className={styles.sleepDurationBtnGroup}>
                          <button
                            type="button"
                            className={styles.sleepDurationResetBtn}
                            onClick={() => setEditSleepMinStep(0)}
                          >
                            0분
                          </button>
                          <button
                            type="button"
                            className={styles.sleepDurationNowBtn}
                            onClick={() => {
                              const displayMs = timePanelAnchorAtMs + timePanelHourOffset * 3600000;
                              const elapsedMin = Math.max(0, Math.round((Date.now() - displayMs) / 60000));
                              setEditSleepMinStep(Math.min(6, Math.round(Math.min(60, elapsedMin) / 10)));
                            }}
                          >
                            지금 완료
                          </button>
                        </div>
                      </div>
                      <div className={styles.breastBtnRow}>
                        <button
                          type="button"
                          className={`${styles.breastBtn} ${editBreast === "left" || editBreast === "both" ? styles.breastBtnActive : ""}`}
                          onClick={() => toggleBreast("left")}
                        >
                          왼쪽 가슴
                        </button>
                        <span className={styles.breastConnector} aria-hidden>◄·······►</span>
                        <button
                          type="button"
                          className={`${styles.breastBtn} ${editBreast === "right" || editBreast === "both" ? styles.breastBtnActive : ""}`}
                          onClick={() => toggleBreast("right")}
                        >
                          오른쪽 가슴
                        </button>
                      </div>
                      <p className={styles.breastDurationDisplay}>
                        {editSleepMinStep === 0 ? "0분" : `${editSleepMinStep * 10}분`}
                      </p>
                      <div className={styles.breastSliderWrap}>
                        <input
                          type="range"
                          min={0}
                          max={6}
                          step={1}
                          value={editSleepMinStep}
                          onChange={(e) => setEditSleepMinStep(Number(e.target.value))}
                          className={styles.breastSlider}
                          aria-label="유축 시간(분 단위)"
                        />
                        <div className={styles.breastSliderTicks}>
                          {[0, 10, 20, 30, 40, 50, 60].map((t) => (
                            <span key={t}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={styles.pumpMlSection}>
                      <div className={styles.pumpMlHeader}>
                        <span className={styles.pumpMlTitle}>유축 양</span>
                      </div>
                      <div className={styles.pumpMlSingleRow}>
                        <input
                          type="number"
                          className={styles.pumpMlSingleInput}
                          value={editMlAmount || ""}
                          placeholder="0"
                          min={0}
                          max={999}
                          onChange={(e) =>
                            setEditMlAmount(Math.max(0, Number(e.target.value) || 0))
                          }
                        />
                        <span className={styles.pumpMlSingleUnit}>ml</span>
                      </div>
                    </div>
                  </>
                )}

                {/* 목욕 전용 — 얼마 동안(분만, 시간 선택 없음) */}
                {(editingLog.categoryId === "bath" || editingLog.categoryId === "tummy") && (
                  <div className={styles.sleepDurationSection}>
                    <div className={styles.sleepDurationHeader}>
                      <span className={styles.sleepDurationTitle}>얼마 동안</span>
                      <div className={styles.sleepDurationBtnGroup}>
                        <button
                          type="button"
                          className={styles.sleepDurationNowBtn}
                          onClick={() => {
                            const displayMs = timePanelAnchorAtMs + timePanelHourOffset * 3600000;
                            const elapsedMin = Math.max(0, Math.round((Date.now() - displayMs) / 60000));
                            setEditSleepMinStep(Math.min(6, Math.round(Math.min(60, elapsedMin) / 10)));
                          }}
                        >
                          지금 끝
                        </button>
                      </div>
                    </div>
                    <p className={styles.sleepDurationDisplay}>
                      {editSleepMinStep === 0 ? "0분" : `${editSleepMinStep * 10}분`}
                    </p>
                    <div className={styles.breastSliderWrap}>
                      <input
                        type="range"
                        min={0}
                        max={6}
                        step={1}
                        value={editSleepMinStep}
                        onChange={(e) => setEditSleepMinStep(Number(e.target.value))}
                        className={styles.breastSlider}
                        aria-label={editingLog.categoryId === "tummy" ? "터미타임 시간(분 단위)" : "목욕 시간(분 단위)"}
                      />
                      <div className={styles.breastSliderTicks}>
                        {[0, 10, 20, 30, 40, 50, 60].map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/*
                  유축수유: 시각 픽커 바로 아래에 분유와 동일한 ‘먹은 양(ml)’만 두고,
                  ‘얼마 동안’ 구간은 제거(저장 시에도 durationMin 미사용).
                */}
                {editingLog.categoryId === "pumpFeed" && (
                  <div className={styles.mlSection}>
                    <p className={styles.mlHeadTitle}>먹은 양</p>
                    <p className={styles.mlDisplay}>{editMlAmount} ml</p>
                    <div className={styles.mlSliderWrap}>
                      <input
                        type="range"
                        min={0}
                        max={300}
                        step={5}
                        value={editMlAmount}
                        onChange={(e) => setEditMlAmount(Number(e.target.value))}
                        className={styles.mlSlider}
                        aria-label="먹은 양(ml)"
                      />
                      <div className={styles.mlSliderTicks}>
                        {[0, 50, 100, 150, 200, 250, 300].map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 우유 — 먹은 양(ml) */}
                {editingLog.categoryId === "milk" && (
                  <div className={styles.mlSection}>
                    <p className={styles.mlHeadTitle}>먹은 양</p>
                    <p className={styles.mlDisplay}>{editMlAmount} ml</p>
                    <div className={styles.mlSliderWrap}>
                      <input
                        type="range"
                        min={0}
                        max={300}
                        step={5}
                        value={editMlAmount}
                        onChange={(e) => setEditMlAmount(Number(e.target.value))}
                        className={styles.mlSlider}
                        aria-label="먹은 양(ml)"
                      />
                      <div className={styles.mlSliderTicks}>
                        {[0, 50, 100, 150, 200, 250, 300].map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 유축수유 — 가슴 쪽만 선택(얼마 동안 UI 없음) */}
                {editingLog.categoryId === "pumpFeed" && (
                  <div className={styles.breastSection}>
                    <div className={styles.breastBtnRow}>
                      <button
                        type="button"
                        className={`${styles.breastBtn} ${editBreast === "left" || editBreast === "both" ? styles.breastBtnActive : ""}`}
                        onClick={() => toggleBreast("left")}
                      >
                        왼쪽 가슴
                      </button>
                      <span className={styles.breastConnector} aria-hidden>◄·······►</span>
                      <button
                        type="button"
                        className={`${styles.breastBtn} ${editBreast === "right" || editBreast === "both" ? styles.breastBtnActive : ""}`}
                        onClick={() => toggleBreast("right")}
                      >
                        오른쪽 가슴
                      </button>
                    </div>
                  </div>
                )}

                {/* 이유식 전용 — 종류 입력 */}
                {editingLog.categoryId === "weaning" && (
                  <div className={styles.weaningSection}>
                    <p className={styles.weaningSectionTitle}>이유식 종류</p>
                    <input
                      type="text"
                      className={styles.weaningInput}
                      placeholder="예) 쌀죽, 당근죽, 소고기죽…"
                      value={editWeaningType}
                      onChange={(e) => setEditWeaningType(e.target.value)}
                      maxLength={40}
                    />
                  </div>
                )}

                {/* 기저귀 전용 — 종류 선택 */}
                {editingLog.categoryId === "diaper" && (
                  <div className={styles.diaperSection}>
                    <div className={styles.diaperSectionHead}>
                      <span className={styles.diaperSectionTitle}>종류</span>
                    </div>
                    <div className={styles.diaperBtnRow}>
                      {(["pee", "poo", "both"] as const).map((type) => {
                        const label = type === "pee" ? "소변" : type === "poo" ? "대변" : "둘다";
                        return (
                          <button
                            key={type}
                            type="button"
                            className={`${styles.diaperBtn} ${editDiaperType === type ? styles.diaperBtnActive : ""}`}
                            onClick={() => setEditDiaperType((prev) => (prev === type ? undefined : type))}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 분유·이유식 — 먹은 양(유축수유는 시각 아래 별도 블록에서 처리) */}
                {(editingLog.categoryId === "bunyu" || editingLog.categoryId === "weaning") && (
                  <div className={styles.mlSection}>
                    <p className={styles.mlHeadTitle}>먹은 양</p>

                    <p className={styles.mlDisplay}>
                      {editMlAmount} {editingLog.categoryId === "weaning" ? "g" : "ml"}
                    </p>

                    <div className={styles.mlSliderWrap}>
                      <input
                        type="range"
                        min={0}
                        max={300}
                        step={5}
                        value={editMlAmount}
                        onChange={(e) => setEditMlAmount(Number(e.target.value))}
                        className={styles.mlSlider}
                        aria-label={`먹은 양(${editingLog.categoryId === "weaning" ? "g" : "ml"})`}
                      />
                      <div className={styles.mlSliderTicks}>
                        {[0, 50, 100, 150, 200, 250, 300].map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 병원 전용 — 방문 유형 / 병원 이름 / 의사 / 검진 내용 */}
                {editingLog.categoryId === "hospital" && (
                  <div className={styles.hospitalSection}>
                    <div className={styles.hospitalTypeArea}>
                      <span className={styles.hospitalSectionTitle}>방문 유형</span>
                      <div className={styles.hospitalTypeBtnRow}>
                        {(["checkup", "illness"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={`${styles.hospitalTypeBtn} ${editHospitalType === type ? styles.hospitalTypeBtnActive : ""}`}
                            onClick={() => setEditHospitalType((prev) => (prev === type ? undefined : type))}
                          >
                            {type === "checkup" ? "검진" : "질환"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={styles.hospitalRow}>
                      <span className={styles.hospitalRowLabel}>병원 이름</span>
                      <input
                        type="text"
                        className={styles.hospitalRowInput}
                        placeholder="-"
                        value={editHospitalName}
                        maxLength={40}
                        onChange={(e) => setEditHospitalName(e.target.value)}
                      />
                    </div>
                    <div className={styles.hospitalRow}>
                      <span className={styles.hospitalRowLabel}>의사</span>
                      <input
                        type="text"
                        className={styles.hospitalRowInput}
                        placeholder="-"
                        value={editHospitalDoctor}
                        maxLength={30}
                        onChange={(e) => setEditHospitalDoctor(e.target.value)}
                      />
                    </div>
                    <div className={styles.hospitalNoteArea}>
                      <div className={styles.hospitalNoteTitleRow}>
                        <span className={styles.hospitalNoteTitle}>검진 내용</span>
                        <span className={styles.hospitalNoteTime}>
                          {formatRelativeTime(timePanelAnchorAtMs + timePanelHourOffset * 3600000)}
                        </span>
                      </div>
                      <input
                        type="text"
                        className={styles.hospitalNoteInput}
                        placeholder="예: 영유아 검진, 예방접종"
                        value={editHospitalNote}
                        maxLength={80}
                        onChange={(e) => setEditHospitalNote(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* 체온 전용 — 슬라이더 */}
                {editingLog.categoryId === "temp" && (
                  <div className={styles.tempSection}>
                    <span className={styles.tempSectionTitle}>체온</span>
                    <p className={styles.tempDisplay}>
                      {editTempC.toFixed(1)} <span className={styles.tempUnit}>°C</span>
                    </p>
                    <div className={styles.tempSliderWrap}>
                      <input
                        type="range"
                        min={35.0}
                        max={42.0}
                        step={0.1}
                        value={editTempC}
                        onChange={(e) => setEditTempC(Number(e.target.value))}
                        className={styles.tempSlider}
                        aria-label="체온(°C)"
                      />
                      <div className={styles.tempSliderTicks}>
                        {[35, 36, 37, 38, 39, 40, 41, 42].map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 투약 전용 — 약 종류 입력 */}
                {editingLog.categoryId === "med" && (
                  <div className={styles.medSection}>
                    <div className={styles.medSectionHeader}>
                      <span className={styles.medSectionTitle}>약 종류</span>
                    </div>
                    <input
                      type="text"
                      className={styles.medNameInput}
                      placeholder="예: 해열제, 항생제, 비타민…"
                      value={editMedName}
                      maxLength={40}
                      onChange={(e) => setEditMedName(e.target.value)}
                    />
                  </div>
                )}

                {/* 놀이 전용 — 놀이 종류 입력 + 반응 선택 */}
                {editingLog.categoryId === "play" && (
                  <>
                    <div className={styles.playNameSection}>
                      <span className={styles.playSectionTitle}>놀이 종류</span>
                      <input
                        type="text"
                        className={styles.playNameInput}
                        placeholder="예: 책 읽어주기, 촉감놀이…"
                        value={editPlayName}
                        maxLength={40}
                        onChange={(e) => setEditPlayName(e.target.value)}
                      />
                    </div>
                    <div className={styles.playReactionSection}>
                      <div className={styles.playReactionBtnRow}>
                        {(["like", "less-interest"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            className={`${styles.playReactionBtn} ${editPlayReaction === r ? styles.playReactionBtnActive : ""}`}
                            onClick={() => setEditPlayReaction((prev) => (prev === r ? undefined : r))}
                          >
                            {r === "like" ? "좋아함" : "관심적음"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 간식 전용 — 종류 입력 + 먹은 양 슬라이더 */}
                {editingLog.categoryId === "snack" && (
                  <>
                    <div className={styles.snackNameSection}>
                      <span className={styles.snackSectionTitle}>간식 종류</span>
                      <input
                        type="text"
                        className={styles.snackNameInput}
                        placeholder="예: 퓨레, 치즈, 우유…"
                        value={editSnackName}
                        maxLength={40}
                        onChange={(e) => setEditSnackName(e.target.value)}
                      />
                    </div>
                    <div className={styles.snackAmountSection}>
                      <div className={styles.snackAmountHeader}>
                        <span className={styles.snackSectionTitle}>먹은 양</span>
                        <button
                          type="button"
                          className={styles.snackUnitToggle}
                          onClick={() => setEditSnackUnit((u) => (u === "ml" ? "g" : "ml"))}
                        >
                          ⇄ {editSnackUnit === "ml" ? "g" : "ml"}
                        </button>
                      </div>
                      <p className={styles.snackAmountDisplay}>
                        {editSnackAmount} <span className={styles.snackAmountUnit}>{editSnackUnit}</span>
                      </p>
                      <div className={styles.snackSliderWrap}>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={editSnackAmount}
                          onChange={(e) => setEditSnackAmount(Number(e.target.value))}
                          className={styles.snackSlider}
                          aria-label={`간식 먹은 양(${editSnackUnit})`}
                        />
                        <div className={styles.snackSliderTicks}>
                          {[0, 5, 10, 15, 20].map((t) => (
                            <span key={t}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <textarea
                  className={styles.timeEditMemo}
                  placeholder={
                    editingLog.categoryId === "temp"
                      ? "증상 및 간단한 메모를 입력하세요"
                      : editingLog.categoryId === "med"
                      ? "처방전 및 메모를 입력해주세요"
                      : editingLog.categoryId === "play"
                      ? "이곳을 터치하여 메모를 입력해 주세요."
                      : "메모를 입력하세요"
                  }
                  rows={3}
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                />

                <div className={styles.timeEditActions}>
                  <button
                    type="button"
                    className={`${styles.timeEditBtn} ${styles.timeEditBtnCancel}`}
                    onClick={cancelEdit}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={`${styles.timeEditBtn} ${styles.timeEditBtnSave}`}
                    onClick={saveEdit}
                  >
                    수정
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

    </div>
  );
}
