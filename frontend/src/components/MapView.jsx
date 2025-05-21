import React, { useEffect, useRef } from 'react';
import { loadKakaoMapScript, moveToKeywordOnMap } from '../utils/mapUtils';

const MapView = ({ keyword, style }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let map, marker;
    loadKakaoMapScript().then(() => {
      if (mapRef.current) {
        const defaultCoord = { lat: 35.231675, lng: 129.083737 };
        map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(defaultCoord.lat, defaultCoord.lng),
          level: 4,
        });
        marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(defaultCoord.lat, defaultCoord.lng),
        });
        marker.setMap(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;

        if (keyword) {
          moveToKeywordOnMap(keyword, map, marker);
        }
      }
    });

    // cleanup: 지도 컨테이너를 비워줌
    return () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, [keyword]);

  return (
    <div>
      <div ref={mapRef} style={style || { width: '100%', height: '350px', borderRadius: '10px', border: '1px solid #eee' }}></div>
    </div>
  );
};

export default MapView;