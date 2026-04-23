"use client";

import { useEffect, useRef, useState } from "react";
import type { RegionCoords } from "@/components/RegionLiveMap";
import type { NearbyPlace } from "@/lib/kakaoLocalSearch";
import nearbyStyles from "@/components/regionNearby.module.css";

type NearbyPayload = {
  radiusM: number;
  addressLine: string | null;
  hospitals: NearbyPlace[];
  kidsCafes: NearbyPlace[];
  daycares: NearbyPlace[];
  kindergartens: NearbyPlace[];
  kakaoConfigured: boolean;
  headingReceived: number | null;
  searchMode: "forwardCone" | "fullCircle";
  forwardHalfAngleDeg: number;
};

/**
 * 실시간 좌표가 들어올 때마다(디바운스) 서버에 주변 1km 검색을 요청해 텍스트 목록으로 보여 준다.
 * 병원·야간 관련 문구는 카카오 키워드 결과이며, 실제 영업·야간 진료는 전화 등으로 확인해야 한다.
 */
export function RegionNearbyPanel({ coords }: { coords: RegionCoords | null }) {
  const [data, setData] = useState<NearbyPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* 좌표·진행 방향이 바뀌면 전방 필터 결과가 달라지므로 heading 도 키에 넣는다 */
  const coordsKey = coords
    ? `${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}_h${
        coords.headingDeg != null ? coords.headingDeg.toFixed(0) : "na"
      }`
    : null;

  useEffect(() => {
    if (!coordsKey || !coords) {
      setData(null);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);

      fetch("/api/region/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          headingDegrees: coords.headingDeg,
        }),
        signal: ac.signal,
      })
        .then(async (res) => {
          const json = (await res.json()) as NearbyPayload & { message?: string };
          if (!res.ok) {
            throw new Error(json.message ?? "주변 정보를 불러오지 못했습니다.");
          }
          setData(json);
        })
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setError(e instanceof Error ? e.message : "주변 정보를 불러오지 못했습니다.");
          setData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [coordsKey, coords]);

  if (!coords) {
    return (
      <div className={nearbyStyles.regionNearbyRoot}>
        <p className={nearbyStyles.regionNearbyEmpty}>
          위치 권한을 허용하고 지도에서 위치가 잡히면, <strong>현재 위치 주소</strong>와{" "}
          <strong>전방 1km(이동 방향이 잡힐 때)</strong> 또는 <strong>1km 원 안</strong>의 소아과·야간소아과,
          어린이집·유치원·키즈카페 목록이 표시돼요.
        </p>
      </div>
    );
  }

  return (
    <div className={nearbyStyles.regionNearbyRoot}>
      {loading && !data ? (
        <p className={nearbyStyles.regionNearbyLoading}>주변 정보를 불러오는 중…</p>
      ) : null}

      {error ? <p className={nearbyStyles.regionNearbyError}>{error}</p> : null}

      {data && coords && !data.kakaoConfigured && !loading ? (
        <p className={nearbyStyles.regionNearbyError} role="status">
          서버에 <code style={{ fontSize: "0.85em" }}>KAKAO_REST_API_KEY</code> 가 없어 주변 목록을
          불러올 수 없어요. <code style={{ fontSize: "0.85em" }}>.env.local</code> 에 REST API 키를 넣고
          개발 서버를 다시 실행해 주세요.
        </p>
      ) : null}

      {data?.kakaoConfigured ? (
        <>
          <div className={nearbyStyles.regionNearbyCurrentBox}>
            <p className={nearbyStyles.regionNearbyCurrentTitle}>현재 위치</p>
            {data.addressLine ? (
              <p className={nearbyStyles.regionNearbyAddress}>{data.addressLine}</p>
            ) : (
              <p className={nearbyStyles.regionNearbyAddress}>
                주소 변환 결과가 없어요. 잠시 후 다시 시도하거나, 지도에서 위치를 다시 잡아 주세요.
              </p>
            )}
          </div>

          <PlaceSection title="실시간 위치 주위 소아과·야간소아과" places={data.hospitals} />
          <PlaceSection title="실시간 위치 주위 키즈카페" places={data.kidsCafes} />
          <PlaceSection title="실시간 위치 주위 어린이집" places={data.daycares} />
          <PlaceSection title="실시간 위치 주위 유치원" places={data.kindergartens} />
        </>
      ) : null}

      {loading && data ? (
        <p className={nearbyStyles.regionNearbyLoading} style={{ marginTop: "0.75rem" }}>
          위치가 바뀌어 목록을 다시 불러오는 중…
        </p>
      ) : null}
    </div>
  );
}

function PlaceSection({ title, places }: { title: string; places: NearbyPlace[] }) {
  return (
    <section className={nearbyStyles.regionNearbySection} aria-label={title}>
      <h2 className={nearbyStyles.regionNearbySectionTitle}>{title}</h2>
      {places.length === 0 ? (
        <p className={nearbyStyles.regionNearbyEmpty}>검색 결과가 없어요.</p>
      ) : (
        <ul className={nearbyStyles.regionNearbyList}>
          {places.map((p) => (
            <li key={p.id} className={nearbyStyles.regionNearbyItem}>
              <span className={nearbyStyles.regionNearbyPlaceName}>{p.name}</span>
              <span className={nearbyStyles.regionNearbyMeta}>
                약 {p.distanceM}m · {p.categoryName}
                {p.address ? ` · ${p.address}` : ""}
              </span>
              {p.phone ? (
                <span className={nearbyStyles.regionNearbyMeta}>
                  <a
                    href={`tel:${p.phone.replace(/\D/g, "")}`}
                    className={nearbyStyles.regionNearbyPhone}
                  >
                    {p.phone}
                  </a>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
