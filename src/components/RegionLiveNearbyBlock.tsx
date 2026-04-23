"use client";

import { useState } from "react";
import { RegionLiveMap, type RegionCoords } from "@/components/RegionLiveMap";
import { RegionNearbyPanel } from "@/components/RegionNearbyPanel";

/**
 * 지도에서 GPS·heading 을 받아 RegionNearbyPanel 로 서버 `/api/region/nearby` 를 호출하는 묶음.
 * 지역(/region)·정보(/info) 등 여러 페이지에서 같은 동작을 재사용하기 위해 분리했다.
 */
export function RegionLiveNearbyBlock() {
  const [liveCoords, setLiveCoords] = useState<RegionCoords | null>(null);

  return (
    <>
      <RegionLiveMap onCoordsUpdate={setLiveCoords} />
      <RegionNearbyPanel coords={liveCoords} />
    </>
  );
}
