"use client";

import Link from "next/link";
import { RegionLiveNearbyBlock } from "@/components/RegionLiveNearbyBlock";
import styles from "../contentPage.module.css";

/**
 * 지역 페이지 — 카카오 지도 실시간 위치 + 전방 1km(가능 시) 소아과·야간소아과·보육·키즈카페.
 */
export function RegionExperience() {
  return (
    <main className={styles.contentPage}>
      <h1 className={styles.contentTitle}>지역</h1>
      
      <p className={styles.contentLead} style={{ marginTop: "0.75rem" }}>
        <strong>소아과·야간소아과</strong>, <strong>어린이집·유치원</strong>,{" "}
        <strong>키즈카페</strong>는 카카오 지도 기준 검색 결과입니다.
      </p>

      <RegionLiveNearbyBlock />

    </main>
  );
}
