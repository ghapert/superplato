export function loadKakaoMapScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      return resolve();
    }
    const script = document.createElement("script");
    const KAKAO_MAP_API_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => {
        resolve();
      });
    };
    script.onerror = () => reject(new Error("❌ Kakao 지도 스크립트 로딩 실패"));
    document.head.appendChild(script);
  });
}

export function moveToKeywordOnMap(keyword, map, marker) {
  if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) return;
  const ps = new window.kakao.maps.services.Places();
  ps.keywordSearch(keyword, (data, status) => {
    if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
      const place = data[0];
      const latlng = new window.kakao.maps.LatLng(place.y, place.x);
      map.setCenter(latlng);
      marker.setPosition(latlng);
      marker.setMap(map);
    }
  });
}
