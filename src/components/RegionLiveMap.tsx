"use client";

import { useEffect, useRef, useState } from "react";
import regionMap from "@/components/regionMap.module.css";

type GeoStatus =
  | "loading"
  | "tracking"
  | "denied"
  | "unavailable"
  | "timeout"
  | "scriptError";

/**
 * Geolocation 과 주변 검색 패널 공유 필드.
 * headingDeg: 이동 방향(북 0°, 시계방향). 없으면 서버에서 1km 원 전체로만 필터한다.
 */
export type RegionCoords = {
  lat: number;
  lng: number;
  accuracyM: number;
  updatedAt: number;
  headingDeg: number | null;
};

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

/** 카카오 지도: level 이 작을수록 확대(가까이). 첫 화면은 넓게(8), 위치 확보 후 상세(4). */
const LEVEL_OVERVIEW = 8;
const LEVEL_TRACKING = 4;

/**
 * sdk.js 는 한 번만 넣고, autoload=false 이므로 준비 후 kakao.maps.load(callback) 을 호출한다.
 * 이미 스크립트가 있으면 load 콜백만 다시 태운다.
 */
function loadKakaoMapSdk(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("no window"));
      return;
    }

    const runAfterSdk = () => {
      if (!window.kakao?.maps) {
        reject(new Error("kakao.maps missing"));
        return;
      }
      window.kakao.maps.load(() => resolve());
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="dapi.kakao.com/v2/maps/sdk.js"]',
    );
    if (existing) {
      if (window.kakao?.maps) {
        runAfterSdk();
        return;
      }
      existing.addEventListener("load", runAfterSdk, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("kakao script error")),
        { once: true },
      );
      return;
    }

    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    s.async = true;
    s.onload = runAfterSdk;
    s.onerror = () => reject(new Error("kakao script error"));
    document.head.appendChild(s);
  });
}

type Props = {
  /** 위치가 갱신될 때마다 부모(주변 검색 등)에 좌표를 넘긴다 */
  onCoordsUpdate?: (coords: RegionCoords | null) => void;
};

/**
 * 카카오 지도 JavaScript API + watchPosition 으로 마커·정확도 원·지도 중심을 실시간 맞춘다.
 * 브라우저용 키는 NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY (카카오 개발자 콘솔 · 앱 키 · JavaScript 키).
 */
export function RegionLiveMap({ onCoordsUpdate }: Props) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";
  const onCoordsUpdateRef = useRef(onCoordsUpdate);
  onCoordsUpdateRef.current = onCoordsUpdate;

  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerRef = useRef<kakao.maps.Marker | null>(null);
  const circleRef = useRef<kakao.maps.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<GeoStatus>(() =>
    appKey ? "loading" : "unavailable",
  );
  useEffect(() => {
    if (!appKey) {
      setStatus("unavailable");
      return;
    }

    const el = hostRef.current;
    if (!el) return;

    let cancelled = false;

    (async () => {
      try {
        await loadKakaoMapSdk(appKey);
      } catch {
        if (!cancelled) setStatus("scriptError");
        return;
      }

      if (cancelled || !hostRef.current || !window.kakao?.maps) {
        if (!cancelled) setStatus("scriptError");
        return;
      }

      const km = window.kakao.maps;
      const center = new km.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      const map = new km.Map(hostRef.current, {
        center,
        level: LEVEL_OVERVIEW,
      });
      mapRef.current = map;

      requestAnimationFrame(() => {
        if (!cancelled && mapRef.current) {
          window.dispatchEvent(new Event("resize"));
        }
      });

      if (!("geolocation" in navigator)) {
        setStatus("unavailable");
        return;
      }

      setStatus("loading");

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled || !mapRef.current) return;
          const { latitude, longitude, accuracy, heading } = pos.coords;
          const accuracyM = Math.max(accuracy || 0, 8);
          const latlng = new km.LatLng(latitude, longitude);
          const updatedAt = pos.timestamp > 0 ? pos.timestamp : Date.now();
          const headingDeg =
            heading != null && Number.isFinite(heading) && heading >= 0 && heading <= 360
              ? heading
              : null;

          const nextCoords: RegionCoords = {
            lat: latitude,
            lng: longitude,
            accuracyM,
            updatedAt,
            headingDeg,
          };
          onCoordsUpdateRef.current?.(nextCoords);
          setStatus("tracking");

          const m = mapRef.current;

          if (!markerRef.current) {
            markerRef.current = new km.Marker({
              position: latlng,
              map: m,
              title: "현재 위치 (실시간 갱신)",
            });
            circleRef.current = new km.Circle({
              center: latlng,
              radius: accuracyM,
              strokeWeight: 1,
              strokeColor: "#b85c38",
              strokeOpacity: 0.45,
              strokeStyle: "solid",
              fillColor: "#b85c38",
              fillOpacity: 0.12,
              map: m,
            });
            m.setCenter(latlng);
            m.setLevel(LEVEL_TRACKING);
          } else {
            markerRef.current.setPosition(latlng);
            circleRef.current?.setOptions({
              center: latlng,
              radius: accuracyM,
            });
            m.setCenter(latlng);
          }
        },
        (err) => {
          if (cancelled) return;
          if (err.code === 1) setStatus("denied");
          else if (err.code === 2) setStatus("unavailable");
          else if (err.code === 3) setStatus("timeout");
          else setStatus("unavailable");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      );

      watchIdRef.current = watchId;
    })();

    return () => {
      cancelled = true;
      onCoordsUpdateRef.current?.(null);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      markerRef.current?.setMap(null);
      circleRef.current?.setMap(null);
      markerRef.current = null;
      circleRef.current = null;
      mapRef.current = null;
      if (hostRef.current) {
        hostRef.current.innerHTML = "";
      }
    };
  }, [retryKey, appKey]);

  const statusMessage: Record<GeoStatus, string> = {
    loading: "위치를 가져오는 중이에요. 브라우저에서 위치 권한을 허용해 주세요.",
    /** 추적 중에는 지도·뱃지·좌표만 보이고 별도 안내 문구는 두지 않는다 */
    tracking: "",
    denied:
      "위치 권한이 꺼져 있어요. 주소창 옆 자물쇠·사이트 설정에서 위치를 허용한 뒤 다시 시도해 주세요.",
    unavailable: "이 환경에서는 위치 정보를 쓸 수 없어요.",
    timeout: "위치 응답이 늦어졌어요. 실내·GPS 약한 곳에서는 시간이 걸릴 수 있어요.",
    scriptError:
      "카카오 지도 스크립트를 불러오지 못했어요. NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 와 카카오 콘솔 플랫폼(웹 도메인) 등록을 확인해 주세요.",
  };

  if (!appKey) {
    return (
      <div className={regionMap.regionMapWrap}>
        <div className={`${regionMap.regionMapMeta} ${regionMap.regionMapStatusError}`}>
          <p style={{ margin: 0 }}>
            카카오 지도를 쓰려면 프로젝트 루트 <code style={{ fontSize: "0.8em" }}>.env.local</code> 에{" "}
            <code style={{ fontSize: "0.8em" }}>
              NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=JavaScript_키
            </code>
            를 넣고 서버를 다시 실행해 주세요. 카카오 개발자 콘솔에서 앱의{" "}
            <strong>JavaScript 키</strong>를 쓰고, 플랫폼에 사이트 도메인(예:{" "}
            <code>http://localhost:3000</code>)을 등록해야 합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={regionMap.regionMapWrap}>
      <div className={regionMap.regionMapCanvasWrap}>
        <div ref={hostRef} className={regionMap.regionMapCanvas} />
        {status === "tracking" ? (
          <div className={regionMap.regionMapLiveBadge} aria-live="polite">
            <span className={regionMap.regionMapLiveDot} aria-hidden />
            실시간 위치 추적 중
          </div>
        ) : null}
      </div>

      <div className={regionMap.regionMapMeta}>
        {statusMessage[status] ? (
          <p
            className={
              status === "denied" ||
              status === "unavailable" ||
              status === "timeout" ||
              status === "scriptError"
                ? regionMap.regionMapStatusError
                : undefined
            }
            style={{ margin: 0 }}
          >
            {statusMessage[status]}
          </p>
        ) : null}

        {status !== "tracking" && status !== "loading" ? (
          <button
            type="button"
            className={regionMap.regionMapRetryBtn}
            onClick={() => setRetryKey((k) => k + 1)}
          >
            위치 다시 시도
          </button>
        ) : null}
      </div>
    </div>
  );
}
