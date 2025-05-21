import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const AttendanceDetail = () => {
  const { courseId } = useParams();
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [lectureName, setLectureName] = useState('');
  const [gptSummary, setGptSummary] = useState(''); // 추가
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await secureFetchJson(`${baseUrl}/api/attendance/view/${courseId}`);
        if (data?.status !== 'success') {
          setError(data?.message || '출석 정보를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
          return;
        }
        setSummary(data?.data?.summary || null);
        setRecords(data?.data?.records || []);
        let name = data?.data?.lecture_name || data?.data?.lecture || '';
        if (!name && courseId) {
          name = `강의 ID: ${courseId}`;
        }
        setLectureName(name);
        setGptSummary(data?.data?.gpt_summary || ''); // 추가
      } catch (err) {
        setError('출석 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [courseId]);

  if (loading) return (
    <div className="page-bg">
      <div className="attendance-detail-card attendance-loading">
        출석 정보 로딩 중...
      </div>
    </div>
  );
  if (error) return (
    <div className="page-bg">
      <div className="attendance-detail-card attendance-error">
        {error}
      </div>
    </div>
  );
  if (!summary) return (
    <div className="page-bg">
      <div className="attendance-detail-card">
        출석 정보가 없습니다.
      </div>
    </div>
  );

  return (
    <div className="page-bg">
      <div
        className="attendance-detail-card"
        style={{
          display: 'flex',
          gap: 32,
          alignItems: 'stretch',
          minHeight: 600,
          height: 600,
          maxWidth: 1100, // 카드 전체 최대 너비 제한
          margin: "0 auto", // 가운데 정렬
        }}
      >
        {/* 좌측: 출석 요약 */}
        <div
          className="attendance-detail-summary"
          style={{
            flex: '0 0 320px',
            minWidth: 260,
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <h2 className="attendance-detail-summary-title">
            📘 출석 요약 {lectureName && <span className="attendance-detail-lecture-name">({lectureName})</span>}
          </h2>
          <div
            className="attendance-detail-summary-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px 16px',
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            <div className="attendance-detail-summary-item">
              <span className="attendance-detail-summary-label">총 수업</span>
              <div className="attendance-detail-summary-value">{summary["총 수업 예정"]}회</div>
            </div>
            <div className="attendance-detail-summary-item">
              <span className="attendance-detail-summary-label">출석</span>
              <div className="attendance-detail-summary-value">{summary["현재까지 출석 간주 수"]}회</div>
            </div>
            <div className="attendance-detail-summary-item">
              <span className="attendance-detail-summary-label">필요 출석 (2/3)</span>
              <div className="attendance-detail-summary-value">{summary["2/3 기준 최소 출석 필요"]}회</div>
            </div>
            <div className="attendance-detail-summary-item">
              <span className="attendance-detail-summary-label">남은 수업</span>
              <div className="attendance-detail-summary-value">{summary["앞으로 남은 수업 수"]}회</div>
            </div>
            <div className="attendance-detail-summary-item" style={{ gridColumn: '1 / span 2' }}>
              <span className="attendance-detail-summary-label">결석 가능 횟수</span>
              <div className="attendance-detail-summary-value">{summary["앞으로 결석 가능 횟수"]}</div>
            </div>
            <div className="attendance-detail-summary-item" style={{ gridColumn: '1 / span 2' }}>
              <span className="attendance-detail-summary-label">현재 상황</span>
              <div className="attendance-detail-summary-value">{summary["현재 상황"]}</div>
            </div>
          </div>
        </div>
        {/* 가운데: Superplato AI 분석 카드 */}
        {gptSummary && (
          <div
            className="attendance-detail-ai-card"
            style={{
              flex: '0 0 320px',
              minWidth: 260,
              height: '100%',
              background: "#f5f7fa",
              borderRadius: 10,
              padding: "24px 20px",
              color: "#1976d2",
              fontWeight: 600,
              fontSize: 15,
              boxShadow: "0 2px 8px rgba(25,118,210,0.04)",
              border: "1px solid #e3e8ee",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              marginRight: 0,
              marginLeft: 0,
              overflow: "hidden"
            }}
          >
            <div style={{ marginBottom: 10, fontWeight: 800, fontSize: 17, color: "#1976d2" }}>
              🤖 SuperPlato AI 분석
            </div>
            <div
              style={{
                color: "#222",
                fontWeight: 500,
                fontSize: 15,
                whiteSpace: "pre-line",
                overflowY: "auto",
                flex: 1,
                minHeight: 0,
                maxHeight: "100%",
              }}
            >
              {gptSummary}
            </div>
          </div>
        )}
        {/* 우측: 상세 출석 기록 (스크롤) */}
        <div
          style={{
            flex: 1,
            minWidth: 260,
            maxWidth: 340, // 우측 카드 최대 너비 제한
            height: '100%',
            overflowY: 'auto',
            borderLeft: '1px solid #eee',
            paddingLeft: 32,
            boxSizing: 'border-box',
          }}
        >
          <h3 className="attendance-detail-records-title">
            📅 상세 출석 기록
          </h3>
          <ul className="attendance-detail-records-list">
            {records.map((r, idx) => (
              <li key={idx} className="attendance-detail-records-item">
                <div className="attendance-detail-records-date">{r.date}</div>
                <div className="attendance-detail-records-status">{r.period} - <span>{r.status}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetail;
