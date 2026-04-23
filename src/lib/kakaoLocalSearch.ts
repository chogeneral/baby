/**
 * 카카오 로컬 API — 키워드 반경 검색·좌표→주소 변환.
 * 브라우저 지도 SDK 만으로는 반경 POI 를 일괄 조회하기 어려워,
 * 1km 이내 시설 목록은 서버에서 카카오 REST API 로만 조회한다(키는 서버 전용).
 */

export type KakaoKeywordDocument = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name?: string;
  phone?: string;
  /** x,y,radius 사용 시 직선거리(m) 문자열 */
  distance?: string;
  /** 경도(WGS84) 문자열 — 전방 부채꼴 필터에 사용 */
  x?: string;
  /** 위도 문자열 */
  y?: string;
};

export type NearbyPlace = {
  id: string;
  name: string;
  address: string;
  phone: string;
  /** 직선 거리(미터), 알 수 없으면 큰 값 */
  distanceM: number;
  categoryName: string;
  latitude: number;
  longitude: number;
};

/** 카카오 distance 문자열을 숫자 m 로 바꾼다 — 없으면 정렬용 큰 값 */
export function parseKakaoDistanceM(distance: string | undefined): number {
  if (distance == null || distance === "") return 999999;
  const n = Number(distance);
  return Number.isFinite(n) ? n : 999999;
}

function toNearbyPlace(d: KakaoKeywordDocument): NearbyPlace {
  const lat = d.y != null ? Number(d.y) : NaN;
  const lng = d.x != null ? Number(d.x) : NaN;
  return {
    id: d.id,
    name: d.place_name,
    address: d.road_address_name || d.address_name || "",
    phone: d.phone ?? "",
    distanceM: parseKakaoDistanceM(d.distance),
    categoryName: d.category_name,
    latitude: Number.isFinite(lat) ? lat : 0,
    longitude: Number.isFinite(lng) ? lng : 0,
  };
}

/**
 * 키워드 + 중심좌표 + 반경(m) 검색 — 최대 15건.
 */
export async function kakaoKeywordSearch(
  query: string,
  longitude: number,
  latitude: number,
  radiusM: number,
  restApiKey: string,
): Promise<KakaoKeywordDocument[]> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("x", String(longitude));
  url.searchParams.set("y", String(latitude));
  url.searchParams.set("radius", String(radiusM));
  url.searchParams.set("size", "15");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${restApiKey}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { documents?: KakaoKeywordDocument[] };
  return json.documents ?? [];
}

/**
 * 같은 장소 id 는 한 번만 남기고, 더 가까운 distance 기록을 유지한 뒤 거리순 정렬한다.
 */
export function mergeKakaoDocumentsById(
  groups: KakaoKeywordDocument[][],
): NearbyPlace[] {
  const map = new Map<string, KakaoKeywordDocument>();
  for (const arr of groups) {
    for (const d of arr) {
      const prev = map.get(d.id);
      if (!prev) {
        map.set(d.id, d);
        continue;
      }
      if (parseKakaoDistanceM(d.distance) < parseKakaoDistanceM(prev.distance)) {
        map.set(d.id, d);
      }
    }
  }
  return [...map.values()]
    .map(toNearbyPlace)
    .sort((a, b) => a.distanceM - b.distanceM);
}

/**
 * WGS84 좌표를 행정/도로명 주소 문자열로 바꾼다 — ‘현재 위치’ 텍스트 표시용.
 */
export async function kakaoCoordToAddressLine(
  longitude: number,
  latitude: number,
  restApiKey: string,
): Promise<string | null> {
  const url = new URL("https://dapi.kakao.com/v2/local/geo/coord2address.json");
  url.searchParams.set("x", String(longitude));
  url.searchParams.set("y", String(latitude));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${restApiKey}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    documents?: Array<{
      address?: { address_name?: string };
      road_address?: { address_name?: string };
    }>;
  };
  const doc = json.documents?.[0];
  if (!doc) return null;
  const road = doc.road_address?.address_name;
  const jibun = doc.address?.address_name;
  if (road && jibun) return `${road} (지번 ${jibun})`;
  return road ?? jibun ?? null;
}
