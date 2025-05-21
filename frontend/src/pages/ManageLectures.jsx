import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureFetchJson } from '../api/auth';
import LectureList from '../components/LectureList';
import BuildingButtonGroup from '../components/BuildingButtonGroup';
import MapView from '../components/MapView';
import { loadKakaoMapScript } from '../utils/mapUtils';
import SearchBarWithSuggestions from '../components/SearchBarWithSuggestions';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const ManageLectures = () => {
  const [lectures, setLectures] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLectures = async () => {
      setLoading(true);
      try {
        const data = await secureFetchJson(`${baseUrl}/api/lectures/my`);
        setLectures(data?.my_lectures || []);
      } catch (err) {
        setLectures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
    loadKakaoMapScript().then(() => setIsMapLoaded(true));
  }, []);

  useEffect(() => {
    // 디버그용 콘솔 로그 제거
    // console.log('🟢 현재 lectures 상태:', JSON.stringify(lectures, null, 2));
    // lectures.forEach(l =>
    //   l.schedules?.forEach(s =>
    //     console.log(`[${l.name}]`, s.location_details)
    //   )
    // );
  }, [lectures]);

  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
  };

  const handleUpdateLectures = async () => {
    if (!window.confirm('정말로 강의 목록을 업데이트하시겠습니까?')) return;
    setLoading(true);
    try {
      const result = await secureFetchJson(`${baseUrl}/api/lectures/update`, { method: 'POST' });
      if (!result || result.status === 'forbidden') {
        alert('로그인이 필요합니다. 다시 로그인 해주세요.');
        return;
      }
      if (result.status !== 'success') {
        alert(result?.message || '업데이트 중 오류 발생');
        return;
      }
      alert(result?.message || '업데이트 완료!');
      const data = await secureFetchJson(`${baseUrl}/api/lectures/my`);
      setLectures(data?.my_lectures || []);
    } catch (err) {
      alert('업데이트 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    setLoading(true);
    try {
      const result = await secureFetchJson(`${baseUrl}/api/lectures/update_location`, { method: 'POST' });
      alert(result?.message);
      const data = await secureFetchJson(`${baseUrl}/api/lectures/my?` + Date.now());
      setLectures(data?.my_lectures || []);
    } catch (err) {
      alert('강의실 위치 업데이트 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  // 강의 목록 강제 새로고침(디버깅용)
  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      const data = await secureFetchJson(`${baseUrl}/api/lectures/my?` + Date.now());
      setLectures(data?.my_lectures || []);
    } catch (err) {
      alert('강의 목록 새로고침 실패');
    } finally {
      setLoading(false);
    }
  };

  // 강의 클릭 시 출석 상세 페이지로 이동
  const handleLectureClick = (lecture) => {
    if (lecture.plato_course_id) {
      navigate(`/attendance/${lecture.plato_course_id}`);
    }
  };

  return (
    <div className="page-bg manage-lectures-bg">
      <div className="manage-lectures-card">
        {/* 왼쪽: 지도/검색/건물버튼 */}
        <div className="manage-lectures-left">
          <h1 className="manage-lectures-title">🛠 강의 관리</h1>
          <SearchBarWithSuggestions
            onSelect={setSelectedBuilding}
            externalValue={selectedBuilding}
          />
          <div className="manage-lectures-map-wrapper">
            {isMapLoaded && (
              <MapView
                keyword={selectedBuilding || 'default location'}
                style={{ width: "100%", height: "100%", minHeight: 400, borderRadius: 14, border: "1.5px solid #eaf2fa" }}
              />
            )}
          </div>
          <div className="building-btn-group-wrapper">
            <BuildingButtonGroup lectures={lectures} onBuildingClick={setSelectedBuilding} />
          </div>
        </div>
        {/* 오른쪽: 내 강의 목록 + 버튼들 */}
        <div className="manage-lectures-right">
          <div className="manage-lectures-list-wrapper">
            <LectureList lectures={lectures} onLectureClick={handleLectureClick} />
          </div>
          <div className="manage-lectures-actions">
            <button
              onClick={handleUpdateLectures}
              disabled={loading}
              className="button manage-lectures-update-btn"
            >
              🔄 강의목록 업데이트
            </button>
            <button
              onClick={handleUpdateLocation}
              disabled={loading}
              className="button manage-lectures-location-btn"
            >
              📍 강의실 업데이트
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageLectures;