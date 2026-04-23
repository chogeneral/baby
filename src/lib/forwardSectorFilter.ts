/**
 * ‘전방 n km’ 필터 — 이동 방향(heading, 북 0° 시계방향) 기준 부채꼴 안에 있는 장소만 남긴다.
 * heading 이 없으면(정지·미지원) 반경 원 전체를 그대로 둔다.
 */

/** 위치 A→B 방위각(도). 북=0°, 동=90°, WGS84 근사. */
export function bearingDeg(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = (Math.atan2(y, x) * 180) / Math.PI;
  θ = ((θ % 360) + 360) % 360;
  return θ;
}

/** 두 방위각 사이 최소 각도(0~180). */
export function angleDifferenceDeg(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

export type HasGeoForCone = {
  distanceM: number;
  latitude: number;
  longitude: number;
};

/**
 * 직선 거리 ≤ radiusM 이고, heading 이 있으면 그 방향 ±halfWidthDeg 안만 통과.
 */
export function filterByForwardCone<T extends HasGeoForCone>(
  items: T[],
  originLat: number,
  originLng: number,
  headingDeg: number | null | undefined,
  radiusM: number,
  halfWidthDeg: number,
): T[] {
  return items.filter((p) => {
    if (!Number.isFinite(p.distanceM) || p.distanceM > radiusM) return false;
    if (
      headingDeg == null ||
      !Number.isFinite(headingDeg) ||
      headingDeg < 0 ||
      headingDeg > 360
    ) {
      return true;
    }
    const b = bearingDeg(originLat, originLng, p.latitude, p.longitude);
    return angleDifferenceDeg(b, headingDeg) <= halfWidthDeg;
  });
}
