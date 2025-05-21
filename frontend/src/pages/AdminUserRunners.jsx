import React, { useState } from 'react';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

// UTC → KST 변환 함수 수정
const toKSTString = (row) => {
  // row: 출석 객체 전체 또는 timestamp 문자열
  if (!row) return '';
  if (typeof row === 'object') {
    if (row.timestamp_kst) return row.timestamp_kst;
    const utcString = row.timestamp_utc || row.timestamp;
    if (!utcString) return '';
    const date = new Date(utcString.endsWith('Z') ? utcString : utcString + 'Z');
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }
  // row가 문자열(timestamp)일 때
  const date = new Date(row.endsWith('Z') ? row : row + 'Z');
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const AdminUserRunners = () => {
  const [userId, setUserId] = useState('');
  const [enrolledLectures, setEnrolledLectures] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [msg, setMsg] = useState('');
  const [allStatus, setAllStatus] = useState([]);
  const [allStatusLoading, setAllStatusLoading] = useState(false);
  const [allStatusMsg, setAllStatusMsg] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attMsg, setAttMsg] = useState('');

  // 사용자 강의 및 자동출석 강의 동기화
  const fetchUserData = async () => {
    setFetching(true);
    setMsg('');
    setEnrolledLectures([]);
    setSelected([]);
    try {
      const lecRes = await secureFetchJson(`${baseUrl}/api/admin/users/${userId}/enrolled_lectures`);
      if (lecRes.status !== 'success') throw new Error('수강 강의 조회 실패');
      setEnrolledLectures(lecRes.lectures || []);
      // 자동 출석 활성화 강의 동기화
      const autoRes = await secureFetchJson(`${baseUrl}/api/admin/users/${userId}/auto_attendance_targets`);
      const autoLectureIds = (autoRes.lectures || []).map(c => c.lecture_id);
      setSelected(autoLectureIds);
    } catch (e) {
      setMsg('사용자 정보 조회 실패');
    } finally {
      setFetching(false);
    }
  };

  const handleCheck = (lectureId) => {
    setSelected(prev =>
      prev.includes(lectureId)
        ? prev.filter(id => id !== lectureId)
        : [...prev, lectureId]
    );
  };

  // 자동 출석 강의 저장
  const handleSave = async (lectureIds) => {
    setLoading(true);
    setMsg('');
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/users/${userId}/set_auto_attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_ids: lectureIds }),
      });
      setMsg(res.message || '자동 출석 강의가 저장되었습니다.');
      await fetchUserData();
    } catch {
      setMsg('자동 출석 강의 저장 실패');
    } finally {
      setLoading(false);
    }
  };

  // 전체 자동 출석 현황 조회
  const fetchAllRunnerStatus = async () => {
    setAllStatusLoading(true);
    setAllStatusMsg('');
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/runner_status/all`);
      if (res.status === 'success') {
        setAllStatus(res.data || []);
        setAllStatusMsg(`총 ${res.count}건`);
      } else {
        setAllStatus([]);
        setAllStatusMsg('조회 실패');
      }
    } catch {
      setAllStatus([]);
      setAllStatusMsg('조회 실패');
    } finally {
      setAllStatusLoading(false);
    }
  };

  // 사용자 출석 기록 조회
  const fetchAttendances = async () => {
    if (!userId) return;
    setAttLoading(true);
    setAttMsg('');
    setAttendances([]);
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/users/${userId}/attendances`);
      if (res.status === 'success') {
        setAttendances(res.attendances || []);
        setAttMsg(`총 ${res.count}건`);
      } else {
        setAttendances([]);
        setAttMsg('출석 기록 조회 실패');
      }
    } catch {
      setAttendances([]);
      setAttMsg('출석 기록 조회 실패');
    } finally {
      setAttLoading(false);
    }
  };

  return (
    <div className="page-bg" style={{ minHeight: "100vh", background: "#f4f7fb" }}>
      <div className="card" style={{
        maxWidth: 900,
        margin: "48px auto 32px auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(52,152,219,0.08)",
        padding: "36px 32px 32px 32px",
        display: "flex",
        flexDirection: "column"
      }}>
        <h1 style={{ fontSize: 24, marginBottom: 24, color: "#2563eb", fontWeight: 700, letterSpacing: -1 }}>
          사용자 출석강의 관리
        </h1>
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontWeight: 500, color: "#222" }}>
            사용자 ID
            <input
              type="number"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              style={{
                marginLeft: 10,
                width: 90,
                border: "1.5px solid #dbeafe",
                borderRadius: 7,
                padding: "7px 10px",
                fontSize: 15,
                background: "#fafdff"
              }}
              disabled={fetching || loading}
            />
          </label>
          <button
            onClick={fetchUserData}
            disabled={!userId || fetching || loading}
            style={{
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 7,
              padding: "9px 22px",
              fontSize: 16,
              border: "none",
              cursor: (!userId || fetching || loading) ? "not-allowed" : "pointer"
            }}
          >
            조회
          </button>
          <button
            onClick={fetchAttendances}
            disabled={!userId || attLoading}
            style={{
              background: "#f59e42",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 7,
              padding: "9px 22px",
              fontSize: 16,
              border: "none",
              cursor: (!userId || attLoading) ? "not-allowed" : "pointer"
            }}
          >
            출석 기록 보기
          </button>
        </div>
        {/* 출석 기록 테이블 */}
        {(attLoading || attendances.length > 0 || attMsg) && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, color: "#f59e42", marginBottom: 6 }}>
              출석 기록
            </div>
            {attLoading && <div style={{ color: "#888" }}>조회 중...</div>}
            {attMsg && <div style={{ color: "#2563eb", marginBottom: 6 }}>{attMsg}</div>}
            {attendances.length > 0 && (
              <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>출석ID</th>
                      <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>강의명</th>
                      <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>강의ID</th>
                      <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>시간</th>
                      <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>유형</th>
                      <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>인증코드</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map(a => (
                      <tr key={a.attendance_id}>
                        <td style={{ border: "1px solid #e5e7eb", textAlign: "center" }}>{a.attendance_id}</td>
                        <td style={{ border: "1px solid #e5e7eb" }}>{a.lecture_name}</td>
                        <td style={{ border: "1px solid #e5e7eb" }}>{a.lecture_id}</td>
                        <td style={{ border: "1px solid #e5e7eb" }}>{toKSTString(a.timestamp)}</td>
                        <td style={{ border: "1px solid #e5e7eb" }}>{a.type}</td>
                        <td style={{ border: "1px solid #e5e7eb" }}>{a.auth_code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!attLoading && attendances.length === 0 && attMsg && (
              <div style={{ color: "#888" }}>출석 기록이 없습니다.</div>
            )}
          </div>
        )}
        <div style={{
          fontSize: 13,
          color: "#2563eb",
          background: "#e0f2fe",
          borderRadius: 8,
          padding: "6px 12px",
          fontWeight: 600,
          letterSpacing: 0.5,
          border: "1px solid #bae6fd",
          marginBottom: 12
        }}>
          출석강의 자동 출석은 별도의 프로그램 설치 없이<br />
          서버에서 자동으로 관리됩니다.
        </div>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={fetchAllRunnerStatus}
            disabled={allStatusLoading}
            style={{
              background: "#10b981",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 7,
              padding: "8px 18px",
              fontSize: 15,
              border: "none",
              cursor: allStatusLoading ? "not-allowed" : "pointer"
            }}
          >
            전체 출석강의 자동 출석 현황 보기
          </button>
          {allStatusLoading && <span style={{ marginLeft: 12, color: "#888" }}>조회 중...</span>}
          {allStatusMsg && <div style={{ marginTop: 8, color: "#2563eb", fontWeight: 500 }}>{allStatusMsg}</div>}
          {allStatus.length > 0 && (
            <div style={{ marginTop: 14, maxHeight: 320, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>유저ID</th>
                    <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>이름</th>
                    <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>학번</th>
                    <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>강의명</th>
                    <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>코드</th>
                    <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>분반</th>
                    <th style={{ padding: 6, borderBottom: "1px solid #e5e7eb" }}>플라토ID</th>
                  </tr>
                </thead>
                <tbody>
                  {allStatus.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #e5e7eb", textAlign: "center" }}>{row.user_id}</td>
                      <td style={{ border: "1px solid #e5e7eb" }}>{row.user_name}</td>
                      <td style={{ border: "1px solid #e5e7eb" }}>{row.student_id}</td>
                      <td style={{ border: "1px solid #e5e7eb" }}>{row.lecture_name}</td>
                      <td style={{ border: "1px solid #e5e7eb" }}>{row.lecture_code}</td>
                      <td style={{ border: "1px solid #e5e7eb" }}>{row.lecture_section}</td>
                      <td style={{ border: "1px solid #e5e7eb" }}>{row.plato_course_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {fetching && <div style={{ color: "#888" }}>조회 중...</div>}
        {enrolledLectures.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <form
              onSubmit={async e => {
                e.preventDefault();
                // 시간표 정보가 없는 강의만 선택된 경우 제출 막기
                const hasSchedule = selected.some(id => {
                  const lec = enrolledLectures.find(l => l.lecture_id === id);
                  return lec && Array.isArray(lec.schedules) && lec.schedules.length > 0;
                });
                if (!hasSchedule) {
                  setMsg('시간표 정보가 있는 강의를 1개 이상 선택해야 합니다.');
                  return;
                }
                await handleSave(selected);
              }}
            >
              <div style={{ overflowX: "auto", borderRadius: 8, background: "#fafdff", border: "1px solid #e5e7eb" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>자동출석</th>
                      <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>강의명</th>
                      <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>코드</th>
                      <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>분반</th>
                      <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>시간표</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledLectures.map(lec => {
                      const hasSchedule = Array.isArray(lec.schedules) && lec.schedules.length > 0;
                      return (
                        <tr key={lec.lecture_id}>
                          <td style={{ textAlign: "center", border: "1px solid #e5e7eb" }}>
                            <input
                              type="checkbox"
                              checked={selected.includes(lec.lecture_id)}
                              onChange={() => handleCheck(lec.lecture_id)}
                              disabled={!hasSchedule}
                              title={!hasSchedule ? "시간표 정보가 없는 강의는 선택할 수 없습니다." : undefined}
                            />
                          </td>
                          <td style={{ border: "1px solid #e5e7eb" }}>{lec.lecture_name}</td>
                          <td style={{ border: "1px solid #e5e7eb" }}>{lec.code}</td>
                          <td style={{ border: "1px solid #e5e7eb" }}>{lec.section}</td>
                          <td style={{ border: "1px solid #e5e7eb" }}>
                            {(lec.schedules || []).map((s, idx) => (
                              <div key={idx}>
                                {s.weekday} {s.start}~{s.end}
                              </div>
                            ))}
                            {!hasSchedule && (
                              <span style={{ color: "#e11d48", fontSize: 13 }}>시간표 없음</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: 7,
                    padding: "9px 22px",
                    fontSize: 16,
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  자동 출석 강의 저장
                </button>
                <button
                  type="button"
                  onClick={() => handleSave([])}
                  disabled={loading}
                  style={{
                    background: "#e11d48",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: 7,
                    padding: "9px 22px",
                    fontSize: 16,
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  전체 OFF
                </button>
              </div>
            </form>
          </div>
        )}
        {msg && <div style={{ marginTop: 18, color: "#2563eb", fontWeight: 500, textAlign: "center" }}>{msg}</div>}
      </div>
    </div>
  );
};

export default AdminUserRunners;
