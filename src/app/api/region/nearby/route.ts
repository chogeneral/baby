import { NextRequest, NextResponse } from "next/server";
import { filterByForwardCone } from "@/lib/forwardSectorFilter";
import {
  kakaoCoordToAddressLine,
  kakaoKeywordSearch,
  mergeKakaoDocumentsById,
  type NearbyPlace,
} from "@/lib/kakaoLocalSearch";

const RADIUS_M = 1000;
/** 전방 부채꼴 반각(도). ±55° ≈ 정면 110° 폭 — ‘전방 1km’ 느낌에 맞춤 */
const FORWARD_HALF_ANGLE_DEG = 55;

type NearbyResponse = {
  radiusM: number;
  addressLine: string | null;
  hospitals: NearbyPlace[];
  kidsCafes: NearbyPlace[];
  daycares: NearbyPlace[];
  kindergartens: NearbyPlace[];
  kakaoConfigured: boolean;
  /** 클라이언트가 보낸 진행 방향(도). 없으면 원형 1km 전체 */
  headingReceived: number | null;
  /** heading 이 유효할 때만 forwardCone — 아니면 fullCircle */
  searchMode: "forwardCone" | "fullCircle";
  forwardHalfAngleDeg: number;
};

function parseHeading(body: unknown): number | null {
  if (body == null || typeof body !== "object") return null;
  const h = (body as { headingDegrees?: unknown }).headingDegrees;
  if (h == null) return null;
  const n = typeof h === "number" ? h : Number(h);
  if (!Number.isFinite(n) || n < 0 || n > 360) return null;
  return n;
}

/**
 * POST { latitude, longitude, headingDegrees? } — 주소 + 소아과·야간소아과·보육·키즈카페.
 * heading 이 있으면 직선 1km 이면서 진행 방향 ±55° 부채꼴 안만 남긴다.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    latitude?: unknown;
    longitude?: unknown;
    headingDegrees?: unknown;
  };

  const lat = typeof body.latitude === "number" ? body.latitude : Number(body.latitude);
  const lng = typeof body.longitude === "number" ? body.longitude : Number(body.longitude);
  const headingDeg = parseHeading(body);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ message: "좌표가 올바르지 않습니다." }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ message: "좌표 범위가 올바르지 않습니다." }, { status: 400 });
  }

  const restKey = process.env.KAKAO_REST_API_KEY?.trim() ?? "";

  const searchMode: NearbyResponse["searchMode"] =
    headingDeg != null ? "forwardCone" : "fullCircle";

  const base: NearbyResponse = {
    radiusM: RADIUS_M,
    addressLine: null,
    hospitals: [],
    kidsCafes: [],
    daycares: [],
    kindergartens: [],
    kakaoConfigured: !!restKey,
    headingReceived: headingDeg,
    searchMode,
    forwardHalfAngleDeg: FORWARD_HALF_ANGLE_DEG,
  };

  if (!restKey) {
    return NextResponse.json(base);
  }

  const [
    addressLine,
    pediatric,
    nightPed,
    nightPhrase,
    pedAdol,
    kidsCafe,
    kidsCafeSpaced,
    daycare,
    kindergarten,
  ] = await Promise.all([
    kakaoCoordToAddressLine(lng, lat, restKey),
    kakaoKeywordSearch("소아과", lng, lat, RADIUS_M, restKey),
    kakaoKeywordSearch("야간소아과", lng, lat, RADIUS_M, restKey),
    kakaoKeywordSearch("소아과야간", lng, lat, RADIUS_M, restKey),
    /* 병원 표기가 ‘소아청소년과’ 인 곳까지 한 번 더 잡아 합친다 */
    kakaoKeywordSearch("소아청소년과", lng, lat, RADIUS_M, restKey),
    kakaoKeywordSearch("키즈카페", lng, lat, RADIUS_M, restKey),
    kakaoKeywordSearch("키즈 카페", lng, lat, RADIUS_M, restKey),
    kakaoKeywordSearch("어린이집", lng, lat, RADIUS_M, restKey),
    kakaoKeywordSearch("유치원", lng, lat, RADIUS_M, restKey),
  ]);

  const applyCone = (list: NearbyPlace[]) =>
    filterByForwardCone(list, lat, lng, headingDeg, RADIUS_M, FORWARD_HALF_ANGLE_DEG);

  let hospitals = mergeKakaoDocumentsById([pediatric, nightPed, nightPhrase, pedAdol]);
  hospitals = applyCone(hospitals);

  let kidsCafes = applyCone(mergeKakaoDocumentsById([kidsCafe, kidsCafeSpaced]).slice(0, 15));
  let daycares = applyCone(mergeKakaoDocumentsById([daycare]).slice(0, 15));
  let kindergartens = applyCone(mergeKakaoDocumentsById([kindergarten]).slice(0, 15));

  hospitals = hospitals.slice(0, 20);

  return NextResponse.json({
    ...base,
    addressLine,
    hospitals,
    kidsCafes,
    daycares,
    kindergartens,
  } satisfies NearbyResponse);
}
