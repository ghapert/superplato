import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const AdminLectureDetail = () => {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 강의 ID는 URL 파라미터 또는 쿼리스트링에서 가져옴
  const initialLectureId = params.lectureId || searchParams.get('id') || '';
  const [lectureId, setLectureId] = useState(initialLectureId);
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 강의 정보 fetch
  const fetchLecture = async (id) => {
    if (!id) {
      setLecture(null);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    setLecture(null);
    const res = await secureFetchJson(`${baseUrl}/api/admin/lectures/${id}`);
    if (!res) {
      setError('권한이 없거나 서버 오류입니다.');
    } else if (res.status !== 'success') {
      setError(res.detail || res.message || '강의 정보를 불러올 수 없습니다.');
    } else {
      setLecture(res.lecture);
    }
    setLoading(false);
  };

  // URL 파라미터가 바뀌면 자동 조회
  useEffect(() => {
    if (params.lectureId) {
      setLectureId(params.lectureId);
      fetchLecture(params.lectureId);
    } else {
      setLectureId('');
      setLecture(null);
      setError('');
    }
    // eslint-disable-next-line
  }, [params.lectureId]);

  // 페이지 첫 진입 시(파라미터 없이 /admin/lecture로 진입) 검색창만 보이도록
  useEffect(() => {
    if (!params.lectureId && !searchParams.get('id')) {
      setLectureId('');
      setLecture(null);
      setError('');
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  // 쿼리 검색으로 조회
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!lectureId.trim() || isNaN(Number(lectureId))) {
      setError('강의 ID는 숫자여야 합니다.');
      setLecture(null);
      return;
    }
    setSearchParams({ id: lectureId });
    navigate(`/admin/lecture/${lectureId}`);
    // fetchLecture(lectureId); // URL 이동 후 자동 조회됨
  };

  return (
    <div className="page-bg">
      <div className="card" style={{ maxWidth: 600, margin: "40px auto", padding: 32 }}>
        <h1 style={{ fontSize: 22, marginBottom: 18, fontWeight: 700 }}>강의 상세 정보</h1>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
          <input
            type="number"
            min={1}
            placeholder="강의 ID 입력"
            value={lectureId}
            onChange={e => setLectureId(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1.5px solid #dbeafe",
              fontSize: 15,
              width: 120
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="button"
            disabled={loading}
            style={{ minWidth: 80 }}
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </form>
        {error && <div style={{ color: "#e11d48", marginBottom: 14 }}>{error}</div>}
        {lecture && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <b>강의명:</b> {lecture.lecture_name}
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>플라토 코스ID:</b> {lecture.plato_course_id}
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>코드:</b> {lecture.code}
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>분반:</b> {lecture.section}
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>시간표:</b>
              <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
                {lecture.schedules && lecture.schedules.length > 0 ? (
                  lecture.schedules.map((sched, idx) => (
                    <li key={idx}>
                      {sched.weekday} {sched.start}~{sched.end}
                      {sched.location && ` (${sched.location})`}
                    </li>
                  ))
                ) : (
                  <li>시간표 정보 없음</li>
                )}
              </ul>
            </div>
          </div>
        )}
        {/* 아무것도 없을 때 안내 메시지 */}
        {!lecture && !error && !loading && (
          <div style={{ color: "#888", marginTop: 24, textAlign: "center" }}>
            강의 ID를 입력해 검색하세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLectureDetail;
