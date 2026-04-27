"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MutableRefObject } from "react";
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

/** 탭 id — `data` 필드(병원·키즈카페·어린이집·유치원)와 1:1로 대응한다. */
export type NearbyTabId = "hospital" | "kidsCafe" | "daycare" | "kindergarten";

/**
 * 탭 정의(표시 문구 + `NearbyPayload` 의 배열 키) — 헤더 탭·모달 제목에 공통으로 쓴다.
 */
export const NEARBY_TAB_CONFIG: Array<{
  id: NearbyTabId;
  label: string;
  placesKey: keyof Pick<NearbyPayload, "hospitals" | "kidsCafes" | "daycares" | "kindergartens">;
}> = [
  { id: "hospital", label: "소아과", placesKey: "hospitals" },
  { id: "kidsCafe", label: "키즈카페", placesKey: "kidsCafes" },
  { id: "daycare", label: "어린이집", placesKey: "daycares" },
  { id: "kindergarten", label: "유치원", placesKey: "kindergartens" },
];

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    lat !== 0 &&
    lng !== 0 &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/**
 * 지역 목록 항목 클릭 시 **현재 GPS** 를 출발, 장소를 도착으로 한 카카오맵 자동차 길찾기 URL.
 */
function kakaoMapRouteFromHereHref(p: NearbyPlace, from: RegionCoords): string {
  const { latitude: tLat, longitude: tLng, name, address, id: placeId } = p;
  const destOk = isValidLatLng(tLat, tLng);
  const fromOk = isValidLatLng(from.lat, from.lng);
  const fromName = "현재 위치";

  if (fromOk && destOk) {
    return `https://map.kakao.com/link/by/car/${encodeURIComponent(fromName)},${from.lat},${from.lng}/${encodeURIComponent(
      name,
    )},${tLat},${tLng}`;
  }
  if (destOk) {
    return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${tLat},${tLng}`;
  }
  if (placeId) {
    return `https://map.kakao.com/link/to/${placeId}`;
  }
  const query = [name, address].filter(Boolean).join(" ");
  return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
}

/**
 * `coords` 가 바뀔 때마다(디바운스) `/api/region/nearby` 를 호출해
 * 모달·현재 위치 박스에서 쓰는 `data` 를 채운다.
 * — 목록은 모달로만 열기 때문에, 본문에는 탭 **아래** 인라인 리스트는 두지 않는다.
 */
export function useRegionNearbySearch(coords: RegionCoords | null) {
  const [data, setData] = useState<NearbyPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userCoordsForRouteRef = useRef<RegionCoords | null>(null);
  if (coords) {
    userCoordsForRouteRef.current = coords;
  }

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

  return { data, loading, error, userCoordsForRouteRef };
}

type RegionNearbyListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** 열려 있을 때 탭(유형) — 모달 본문에 맞는 목록과 제목 */
  activeTab: NearbyTabId;
  data: NearbyPayload;
  userCoords: RegionCoords;
  userCoordsRef: MutableRefObject<RegionCoords | null>;
};

/**
 * 소아과·키즈카페·어린이집·유치원 중 하나를 누르면 열리는 **목록 전용** 모달.
 * — `role=dialog` + Esc / 백드롭 / 닫기 버튼으로 닫는다(스크롤 잠금은 body 에 적용).
 */
export function RegionNearbyListModal({
  isOpen,
  onClose,
  activeTab,
  data,
  userCoords,
  userCoordsRef,
}: RegionNearbyListModalProps) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const tabDef = NEARBY_TAB_CONFIG.find((t) => t.id === activeTab) ?? NEARBY_TAB_CONFIG[0];
  const places = data[tabDef.placesKey];

  // 모달이 열릴 때 body 스크롤을 막아 뒤 지도·본문이 움직이지 않게 한다.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Esc 키로 닫기 — 모달이 열린 동안만 리스너를 건다(포커스 트랩의 최소한).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // 열릴 때 닫기 버튼에 포커스를 둬 키보드 사용자 흐름을 맞춘다.
  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={nearbyStyles.regionNearbyModalRoot}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={nearbyStyles.regionNearbyModalDialog}
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={nearbyStyles.regionNearbyModalHeader}>
          <h2 className={nearbyStyles.regionNearbyModalTitle} id={titleId}>
            {tabDef.label} ({places.length}곳)
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className={nearbyStyles.regionNearbyModalClose}
            aria-label="목록 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={nearbyStyles.regionNearbyModalBody}>
          <PlaceList
            places={places}
            sectionLabel={tabDef.label}
            userCoords={userCoords}
            userCoordsRef={userCoordsRef}
          />
        </div>
      </div>
    </div>
  );
}

function PlaceList({
  places,
  sectionLabel,
  userCoords,
  userCoordsRef,
}: {
  places: NearbyPlace[];
  sectionLabel: string;
  userCoords: RegionCoords;
  userCoordsRef: MutableRefObject<RegionCoords | null>;
}) {
  return (
    <section className={nearbyStyles.regionNearbyListSection} aria-label={`${sectionLabel} 주변 목록`}>
      {places.length === 0 ? (
        <p className={nearbyStyles.regionNearbyEmpty}>검색 결과가 없어요.</p>
      ) : (
        <ul className={nearbyStyles.regionNearbyList}>
          {places.map((p) => (
            <li key={p.id} className={nearbyStyles.regionNearbyItem}>
              <a
                href={kakaoMapRouteFromHereHref(p, userCoords)}
                target="_blank"
                rel="noopener noreferrer"
                className={nearbyStyles.regionNearbyMapLink}
                onClick={(e) => {
                  const live = userCoordsRef.current;
                  if (live) {
                    (e.currentTarget as HTMLAnchorElement).href = kakaoMapRouteFromHereHref(p, live);
                  }
                }}
                aria-label={`${p.name} — 현재 위치에서 카카오맵 자동차 길찾기 열기`}
              >
                <span className={nearbyStyles.regionNearbyPlaceName}>{p.name}</span>
                <span className={nearbyStyles.regionNearbyMeta}>
                  약 {p.distanceM}m · {p.categoryName}
                  {p.address ? ` · ${p.address}` : ""}
                </span>
              </a>
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

type RegionNearbyInfoSectionProps = {
  coords: RegionCoords | null;
  data: NearbyPayload | null;
  loading: boolean;
  error: string | null;
};

/**
 * **현재 위치** 주소 카드(및 권한 전 안내) — `RegionLiveMap` **지도 아래**에 둔다(위: 지도, 아래: 이 블록).
 * — 소아과 등 **목록 본문은 모달**에만 있으므로 여기엔 탭/리스트를 두지 않는다.
 */
export function RegionNearbyInfoSection({ coords, data, loading, error }: RegionNearbyInfoSectionProps) {
  if (!coords) {
    return (
      <div className={nearbyStyles.regionNearbyRoot}>
        <p className={nearbyStyles.regionNearbyEmpty}>
          <strong>위 지도</strong>에서 위치 권한을 허용하고 내 위치가 잡히면, <strong>이 아래</strong>에
          <strong> 현재 위치 주소</strong>가 표시돼요. <strong>우측 상단 탭(소아과·키즈카페·어린이집·유치원)</strong>
          을 눌러 전방 1km(이동 방향이 잡힐 때) 또는 1km 원 안 검색 목록을 볼 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className={nearbyStyles.regionNearbyRoot}>
      {loading && !data ? <p className={nearbyStyles.regionNearbyLoading}>주변 정보를 불러오는 중…</p> : null}

      {error ? <p className={nearbyStyles.regionNearbyError}>{error}</p> : null}

      {data && coords && !data.kakaoConfigured && !loading ? (
        <p className={nearbyStyles.regionNearbyError} role="status">
          서버에 <code style={{ fontSize: "0.85em" }}>KAKAO_REST_API_KEY</code> 가 없어 주변 목록을
          불러올 수 없어요. <code style={{ fontSize: "0.85em" }}>.env.local</code> 에 REST API 키를 넣고
          개발 서버를 다시 실행해 주세요.
        </p>
      ) : null}

      {data?.kakaoConfigured ? (
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
      ) : null}

      {loading && data ? (
        <p className={nearbyStyles.regionNearbyLoading} style={{ marginTop: "0.75rem" }}>
          위치가 바뀌어 정보를 다시 불러오는 중…
        </p>
      ) : null}
    </div>
  );
}

type RegionNearbyHeaderTabsProps = {
  data: NearbyPayload;
  activeTabId: NearbyTabId;
  onSelectTab: (id: NearbyTabId) => void;
};

/**
 * `지역` 제목 **오른쪽**에 붙는 4개 탭 — 누르면 같은 탭 id 로 모달이 열린다(부모가 `listModalOpen` 을 true 로 맞춤).
 */
export function RegionNearbyHeaderTabs({ data, activeTabId, onSelectTab }: RegionNearbyHeaderTabsProps) {
  return (
    <div
      role="tablist"
      className={nearbyStyles.regionNearbyHeaderTabList}
      aria-label="주변 시설 유형(목록은 모달)"
    >
      {NEARBY_TAB_CONFIG.map((tab) => {
        const count = data[tab.placesKey].length;
        const isSelected = activeTabId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`regionNearbyTab-${tab.id}`}
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={
              isSelected
                ? `${nearbyStyles.regionNearbyTab} ${nearbyStyles.regionNearbyTabActive}`
                : nearbyStyles.regionNearbyTab
            }
            onClick={() => onSelectTab(tab.id)}
            aria-label={`${tab.label} ${count}곳, 목록을 모달로 열기`}
          >
            <span className={nearbyStyles.regionNearbyTabLabel}>{tab.label}</span>
            <span className={nearbyStyles.regionNearbyTabCount} aria-hidden>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
