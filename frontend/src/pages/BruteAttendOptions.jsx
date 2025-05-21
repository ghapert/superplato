import React, { useEffect, useState, useRef } from 'react';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const BruteAttendOptions = () => {
  const [lectures, setLectures] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [stopping, setStopping] = useState(false);
  const [stopStatus, setStopStatus] = useState(null); // 'success' | 'error' | null
  const stopBtnRef = useRef();

  // 추가: 현재 자동 출석 중인 강의 목록
  const [currentCourses, setCurrentCourses] = useState([]);
  const [currentMsg, setCurrentMsg] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [currentLoading, setCurrentLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [runnerPid, setRunnerPid] = useState(null); // 중앙 runner 구조에서는 항상 null

  // 1. 현재 자동 출석 중인 강의 목록 호출 함수
  const fetchCurrent = async () => {
    setCurrentLoading(true);
    try {
      const res = await secureFetchJson(`${baseUrl}/api/attendance/current_auto_attend_courses`);
      if (res?.status === 'success') {
        setCurrentCourses(res.courses || []);
        setCurrentMsg(res.message || '');
        setRunnerPid(null); // 중앙 runner 구조라 pid 없음
      } else {
        setCurrentCourses([]);
        setCurrentMsg(res?.message || '불러오기 실패');
        setRunnerPid(null);
      }
    } catch {
      setCurrentCourses([]);
      setCurrentMsg('불러오기 실패');
      setRunnerPid(null);
    } finally {
      setCurrentLoading(false);
    }
  };

  // 처음 컴포넌트가 마운트될 때 1회 호출
  useEffect(() => {
    fetchCurrent();
  }, []);

  // 2. ‘수정 모드(showEdit)’에 들어갔을 때, 전체 강의 목록을 불러옴
  useEffect(() => {
    if (!showEdit) return;
    const fetchLectures = async () => {
      setLoading(true);
      try {
        const res = await secureFetchJson(`${baseUrl}/api/attendance/my_lectures`);
        if (res?.status === 'success') {
          setLectures(res.lectures || []);
        }
      } catch {
        setLectures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
  }, [showEdit]);

  // 체크박스 토글
  const handleChange = (lectureId) => {
    setSelected(prev =>
      prev.includes(lectureId)
        ? prev.filter(id => id !== lectureId)
        : [...prev, lectureId]
    );
  };

  // 3. ‘자동 Pro 출석 실행(저장)’ 버튼
  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setSaveStatus(null);

    try {
      const res = await secureFetchJson(`${baseUrl}/api/attendance/set_auto_attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_ids: selected }),
      });

      if (res?.status === 'success') {
        setMessage(res?.message || (selected.length === 0 ? '전체 OFF' : '자동 출석 실행됨.'));
        setSaveStatus('success');
        // 저장 성공 시 목록 갱신
        await fetchCurrent();
        setShowEdit(false);
      } else {
        setMessage(res?.message || '실행 실패');
        setSaveStatus('error');
      }
    } catch {
      setMessage('실행 중 오류 발생');
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 1200);
    }
  };

  // 4. ‘전체 OFF’ 버튼(수동)
  const handleStopRunner = async () => {
    setStopping(true);
    setMessage('');
    setStopStatus(null);
    try {
      const res = await secureFetchJson(`${baseUrl}/api/attendance/set_auto_attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_ids: [] }),
      });
      if (res?.status === 'success') {
        setMessage(res?.message || '모든 자동 출석 OFF');
        setStopStatus('success');
        await fetchCurrent();
        setShowEdit(false);
      } else {
        setMessage(res?.message || '실패');
        setStopStatus('error');
      }
    } catch {
      setMessage('프로세스 종료 중 오류 발생');
      setStopStatus('error');
    } finally {
      setStopping(false);
      setTimeout(() => setStopStatus(null), 1200);
    }
  };

  // ---- UI 렌더링 ----

  // (A) 수정 모드 아닐 때 → “현재 자동출석 중 강의” 화면
  if (!showEdit) {
    return (
      <div className="page-bg">
        <div
          className="card"
          style={{
            maxWidth: 900,
            margin: "40px auto",
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18
          }}>
            <h1 style={{ color: "#444", fontWeight: 800, fontSize: "1.3em", margin: 0 }}>
              현재 자동 Pro 출석 중인 강의
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {currentLoading ? null : (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: currentCourses.length > 0 ? "#22c55e" : "#e11d48",
                      marginRight: 6,
                      boxShadow: currentCourses.length > 0
                        ? "0 0 4px #22c55e88"
                        : "0 0 4px #e11d4888"
                    }}
                  />
                  <span style={{
                    fontWeight: 700,
                    color: currentCourses.length > 0 ? "#22c55e" : "#e11d48",
                    fontSize: 16
                  }}>
                    {currentCourses.length > 0 ? "자동 출석 활성화" : "중지됨"}
                  </span>
                </>
              )}
            </div>
          </div>
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
            자동 출석은 별도의 프로그램 설치 없이<br />
            서버에서 자동으로 관리됩니다.
          </div>
          {currentLoading ? (
            <div style={{ color: "#888" }}>불러오는 중...</div>
          ) : (
            <>
              {currentCourses.length === 0 ? (
                <div style={{ color: "#888", marginBottom: 16 }}>
                  {currentMsg || "현재 활성화된 강의가 없습니다."}
                </div>
              ) : (
                <ul style={{ padding: 0, listStyle: "none", marginBottom: 16 }}>
                  {currentCourses.map((course, idx) => (
                    <li key={idx} style={{ marginBottom: 8, color: "#444", fontWeight: 600 }}>
                      {course.lecture_name || course.course_id}
                      <span style={{ fontWeight: 400, color: "#888", marginLeft: 8 }}>
                        {course.code && course.section ? `(${course.code}-${course.section})` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="button"
                style={{ width: "100%", marginTop: 8 }}
                onClick={() => setShowEdit(true)}
              >
                자동 출석 강의 수정하기
              </button>
            </>
          )}
          {message && <div style={{ marginTop: 16, color: "#888", textAlign: "center" }}>{message}</div>}
        </div>
      </div>
    );
  }

  // (B) 수정 모드일 때 → “전체 강의 목록” & 체크박스
  return (
    <div className="page-bg">
      <div
        className="card"
        style={{
          maxWidth: 900,
          margin: "40px auto",
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <h1 style={{ color: "#444", fontWeight: 800, fontSize: "1.3em", marginBottom: 18 }}>
          자동 Pro 출석 강의 선택
        </h1>
        {loading ? (
          <div style={{ color: "#888" }}>불러오는 중...</div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (selected.length === 0) {
                setMessage('한 개 이상의 강의를 선택해야 합니다.');
                setSaveStatus('error');
                setTimeout(() => setSaveStatus(null), 1200);
                return;
              }
              handleSave();
            }}
          >
            <div style={{ marginBottom: 24 }}>
              {lectures.length === 0 && <div style={{ color: "#888" }}>선택 가능한 강의가 없습니다.</div>}
              {lectures.map(lec => {
                const hasSchedule = Array.isArray(lec.schedules) && lec.schedules.length > 0;
                const lectureName = lec.lecture_name || lec.name || lec.code || lec.plato_course_id || '강의';
                return (
                  <div
                    key={lec.lecture_id}
                    style={{
                      border: "1px solid #ededed",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 14,
                      background: "#fafafa"
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", fontWeight: 600, color: "#444" }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(lec.lecture_id)}
                        onChange={() => handleChange(lec.lecture_id)}
                        style={{ marginRight: 10 }}
                        disabled={!hasSchedule}
                        title={!hasSchedule ? "시간표 정보가 없는 강의는 선택할 수 없습니다." : undefined}
                      />
                      <span>
                        {lectureName}
                        <span style={{ fontWeight: 400, color: "#888", marginLeft: 8 }}>
                          ({lec.code}-{lec.section})
                        </span>
                      </span>
                    </label>
                    {lec.schedules && lec.schedules.length > 0 && (
                      <ul style={{ margin: "8px 0 0 0", padding: 0, listStyle: "none", fontSize: 14 }}>
                        {lec.schedules.map((sched, idx) => (
                          <li key={idx} style={{ color: "#666", marginBottom: 2 }}>
                            <span style={{ marginRight: 8 }}>
                              {sched.weekday} {sched.start}~{sched.end}
                            </span>
                            {sched.location_details && (
                              <span>
                                {sched.location_details.building_name
                                  ? `${sched.location_details.building_name} `
                                  : ""}
                                {sched.location_details.room_number
                                  ? `${sched.location_details.room_number}`
                                  : ""}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!hasSchedule && (
                      <span style={{ color: "#e11d48", fontSize: 13, marginLeft: 4 }}>시간표 없음</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="submit"
              className="button"
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 8,
                background:
                  saveStatus === "success"
                    ? "#43a047"
                    : saveStatus === "error"
                    ? "#e57373"
                    : undefined,
                color: saveStatus ? "#fff" : undefined,
                transition: "background 0.2s"
              }}
            >
              {saving
                ? "저장 중..."
                : saveStatus === "success"
                ? "저장됨"
                : saveStatus === "error"
                ? "저장 실패"
                : "자동 Pro 출석 실행"}
            </button>
            <button
              type="button"
              className="button"
              ref={stopBtnRef}
              style={{
                width: "100%",
                marginTop: 12,
                background: stopStatus === "success"
                  ? "#43a047"
                  : "#e57373",
                color: "#fff",
                animation: stopStatus === "error" ? "shake 0.4s" : undefined,
                transition: "background 0.2s"
              }}
              onClick={handleStopRunner}
              disabled={stopping}
            >
              {stopping
                ? "종료 중..."
                : stopStatus === "success"
                ? "모든 자동 출석 OFF"
                : stopStatus === "error"
                ? "종료 실패"
                : "자동 Pro 출석 전체 OFF"}
            </button>
            {message && <div style={{ marginTop: 16, color: "#888", textAlign: "center" }}>{message}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default BruteAttendOptions;