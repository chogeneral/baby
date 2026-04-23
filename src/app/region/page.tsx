import type { Metadata } from "next";
import { RegionExperience } from "./RegionExperience";

export const metadata: Metadata = {
  title: "지역",
  description:
    "카카오 지도 실시간 위치와 주변 1km 병원·키즈카페·어린이집·유치원 안내",
};

/**
 * 헤더 GNB ‘지역’ — 서버 메타만 두고 본문은 RegionExperience 클라이언트에서 지도·주변 검색을 묶는다.
 */
export default function RegionPage() {
  return <RegionExperience />;
}
