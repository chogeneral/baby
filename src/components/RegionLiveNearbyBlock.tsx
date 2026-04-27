"use client";

import { useCallback, useEffect, useState } from "react";
import { RegionLiveMap, type RegionCoords } from "@/components/RegionLiveMap";
import {
  type NearbyTabId,
  RegionNearbyHeaderTabs,
  RegionNearbyInfoSection,
  RegionNearbyListModal,
  useRegionNearbySearch,
} from "@/components/RegionNearbyPanel";
import { RegionKmBoardBlock } from "@/components/RegionKmBoardBlock";
import nearbyStyles from "@/components/regionNearby.module.css";
import contentPageStyles from "@/app/contentPage.module.css";
import type { ReactNode } from "react";

/**
 * `지역` 제목(좌) + 주변 시설 탭(우) + 리드(옵션) + **지도** + **현재 위치** + 그 **아래 동네 1km 목록**.
 * — `RegionKmBoardBlock` 은 `RegionNearbyInfoSection` 바로 아래에 둔다.
 */
export function RegionLiveNearbyBlock({ children }: { children?: ReactNode }) {
  const [liveCoords, setLiveCoords] = useState<RegionCoords | null>(null);
  const { data, loading, error, userCoordsForRouteRef } = useRegionNearbySearch(liveCoords);
  const [activeTabId, setActiveTabId] = useState<NearbyTabId>("hospital");
  const [listModalOpen, setListModalOpen] = useState(false);

  // `/region/write` 에서 제출용 좌표 힌트로 쓰기 위해, 메인에서 잡힌 GPS 를 sessionStorage 에 맞춰 둔다.
  useEffect(() => {
    if (!liveCoords) return;
    try {
      sessionStorage.setItem("regionBoardLastCoords", JSON.stringify(liveCoords));
    } catch {
      /* private 모드·할당량 등 */
    }
  }, [liveCoords]);

  const onSelectTab = (id: NearbyTabId) => {
    setActiveTabId(id);
    setListModalOpen(true);
  };

  // 모달 `onClose`·Esc 핸들러에 넘기므로 매 렌더마다 바뀌지 않게 고정해 effect 재구독을 줄인다.
  const closeModal = useCallback(() => setListModalOpen(false), []);

  return (
    <>
      <div className={nearbyStyles.regionPageTitleRow}>
        <h1 className={contentPageStyles.contentTitle}>지역</h1>
        {data?.kakaoConfigured && liveCoords ? (
          <RegionNearbyHeaderTabs data={data} activeTabId={activeTabId} onSelectTab={onSelectTab} />
        ) : null}
      </div>
      {children}
      {/*
       * **지도** → `현재 위치`(주소·안내) → 그 **아래** 동네 1km 목록. GPS 는 지도에서 잡힌다.
       */}
      <RegionLiveMap onCoordsUpdate={setLiveCoords} />
      <RegionNearbyInfoSection coords={liveCoords} data={data} loading={loading} error={error} />
      <RegionKmBoardBlock coords={liveCoords} />
      {listModalOpen && data?.kakaoConfigured && liveCoords ? (
        <RegionNearbyListModal
          isOpen
          onClose={closeModal}
          activeTab={activeTabId}
          data={data}
          userCoords={liveCoords}
          userCoordsRef={userCoordsForRouteRef}
        />
      ) : null}
    </>
  );
}
