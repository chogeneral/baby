/**
 * 카카오 지도 JavaScript API — RegionLiveMap 에서 쓰는 심볼만 최소 선언한다.
 * https://apis.map.kakao.com/web/guide/ 기준, autoload=false 후 kakao.maps.load() 로 초기화한다.
 */
export {};

declare global {
  namespace kakao.maps {
    class LatLng {
      constructor(lat: number, lng: number);
    }

    class Map {
      constructor(
        container: HTMLElement,
        options: { center: LatLng; level: number },
      );
      setCenter(latlng: LatLng): void;
      setLevel(level: number): void;
    }

    class Marker {
      constructor(options: {
        position: LatLng;
        map: Map;
        title?: string;
      });
      setPosition(latlng: LatLng): void;
      setMap(map: Map | null): void;
    }

    class Circle {
      constructor(options: {
        center: LatLng;
        radius: number;
        strokeWeight?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeStyle?: string;
        fillColor?: string;
        fillOpacity?: number;
        map?: Map;
      });
      setMap(map: Map | null): void;
      setOptions(options: {
        center?: LatLng;
        radius?: number;
        strokeWeight?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        fillColor?: string;
        fillOpacity?: number;
      }): void;
    }
  }

  const kakao: {
    maps: {
      load: (callback: () => void) => void;
      LatLng: new (lat: number, lng: number) => kakao.maps.LatLng;
      Map: new (
        container: HTMLElement,
        options: { center: kakao.maps.LatLng; level: number },
      ) => kakao.maps.Map;
      Marker: new (options: {
        position: kakao.maps.LatLng;
        map: kakao.maps.Map;
        title?: string;
      }) => kakao.maps.Marker;
      Circle: new (options: {
        center: kakao.maps.LatLng;
        radius: number;
        strokeWeight?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeStyle?: string;
        fillColor?: string;
        fillOpacity?: number;
        map?: kakao.maps.Map;
      }) => kakao.maps.Circle;
    };
  };

  interface Window {
    kakao?: typeof kakao;
  }
}
