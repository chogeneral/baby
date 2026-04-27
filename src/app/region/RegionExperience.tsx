"use client";

import { RegionLiveNearbyBlock } from "@/components/RegionLiveNearbyBlock";
import styles from "../contentPage.module.css";

/**
 * 지역 페이지 — 제목 옆 탭에서 모달로 목록, 카카오 지도 실시간 위치 + 전방 1km(가능 시) 주변 시설.
 */
export function RegionExperience() {
  return (
    <main className={styles.contentPage}>
      <RegionLiveNearbyBlock>
        <p className={styles.contentLead} style={{ marginTop: "0.75rem" }}>
          <strong>소아과·야간소아과</strong>, <strong>어린이집·유치원</strong>,{" "}
          <strong>키즈카페</strong>는 카카오 지도 기준 검색 결과입니다. 상단 탭을 누르면 목록이 모달로
          열립니다.
        </p>
      </RegionLiveNearbyBlock>
    </main>
  );
}
