import React, { useEffect, useState } from 'react';
import { secureFetchJson, googleLogin } from '../api/auth';
import AttendanceForm from '../components/AttendanceForm';

const Home = ({ isPro }) => {
  const [userName, setUserName] = useState('');
  const [nextLecture, setNextLecture] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [now, setNow] = useState(new Date());
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

  // 현재 시간 실시간 표시
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // JWT가 있을 때만 fetch, 없으면 상태 초기화
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      setUserName('');
      setNextLecture(null);
      setAttendanceStatus(null);
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await secureFetchJson(`${baseUrl}/api/auth/me`);
        if (res && res.name) {
          setUserName(res.name);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchNextLecture = async () => {
      try {
        const res = await secureFetchJson(`${baseUrl}/api/lectures/next`);
        if (res && res.status !== 'none') {
          setNextLecture(res);
        }
      } catch (error) {
        console.error('Error fetching next lecture:', error);
      }
    };

    const fetchAttendanceStatus = async () => {
      try {
        const res = await secureFetchJson(`${baseUrl}/api/attendance/status`);
        setAttendanceStatus(res);
      } catch (error) {
        setAttendanceStatus({ can_attend: false, message: '출석 정보를 불러올 수 없습니다.' });
      }
    };

    fetchUserData();
    fetchNextLecture();
    fetchAttendanceStatus();
  }, []); // JWT가 바뀔 일은 없으므로 deps는 []

  useEffect(() => {
    if (!nextLecture || !nextLecture.start_time) {
      setTimeLeft('');
      return;
    }
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(nextLecture.start_time);
      const diff = Math.max(0, Math.floor((start - now) / 1000));
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setTimeLeft(
        diff > 0
          ? `다음 강의까지 ${hours}시간 ${minutes}분 ${seconds}초 남았습니다.`
          : '수업중입니다!'
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [nextLecture]);

  return (
    <div className="page-bg">
      <div className="home-card">
        {/* 현재 컴퓨터 시간 표시 */}
        <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
          현재 컴퓨터 시간: {now.toLocaleString()} ({now.toISOString()})
        </div>
        {isPro ? (
          <h1
            className="home-title"
            style={{
              background: "linear-gradient(90deg, #1976d2 30%, #ffb300 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              fontWeight: 900,
              fontSize: 38,
              marginBottom: 8,
              letterSpacing: -1,
              // 추가: display: inline-block 및 -webkit-text-fill-color: transparent 보장
              display: "inline-block",
              MozBackgroundClip: "text",
              MozTextFillColor: "transparent"
            }}
          >
            SuperPlato Pro
          </h1>
        ) : (
          <h1 className="home-title">SuperPlato</h1>
        )}
        {userName && <p className="home-welcome">환영합니다, <b>{userName}</b>님!</p>}
        {userName ? (
          <>
            {nextLecture ? (
              <div className="next-lecture-card">
                <h2 className="next-lecture-title">다음 강의</h2>
                <div className="next-lecture-name">{nextLecture.name}</div>
                <div className="next-lecture-time">
                  시간: {
                    (() => {
                      const date = new Date(nextLecture.start_time);
                      const hour = date.getHours();
                      const minute = date.getMinutes();
                      const isAM = hour < 12;
                      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                      const period = isAM ? '오전' : '오후';
                      return `${period} ${hour12}시${minute > 0 ? ` ${minute}분` : ''}`;
                    })()
                  }
                </div>
                <div className="next-lecture-countdown">{timeLeft}</div>
              </div>
            ) : (
              <p className="no-lecture-msg">예정된 강의가 없습니다.</p>
            )}
            <div className="attendance-form-wrapper">
              {attendanceStatus && attendanceStatus.can_attend ? (
                <AttendanceForm isPro={isPro} />
              ) : (
                attendanceStatus && <div className="attendance-status-msg">{attendanceStatus.message}</div>
              )}
            </div>
          </>
        ) : (
          <div className="login-required-card">
            <p className="login-required-msg">로그인이 필요합니다.</p>
            <button
              className="button login-btn"
              onClick={async () => {
                try {
                  await googleLogin();
                  window.location.reload();
                } catch (e) {
                  alert('로그인에 실패했습니다.');
                }
              }}
            >
              구글로 로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;