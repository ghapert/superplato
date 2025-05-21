import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', student_id: '', student_password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false); // 개인정보 동의 상태 추가
  const navigate = useNavigate();

  // 입력창 ref
  const nameRef = useRef(null);
  const idRef = useRef(null);
  const pwRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await secureFetchJson(`${baseUrl}/api/auth/me`);
        if (res && res.name) {
          setForm(f => ({ ...f, name: res.name }));
        }
      } catch {}
    })();
  }, []);

  // 엔터로 다음 입력창 이동
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) nextRef.current.focus();
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.student_id || !form.student_password) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    if (!agree) {
      alert('개인정보 처리방침에 동의해야 회원가입이 가능합니다.');
      return;
    }
    setLoading(true);
    try {
      const res = await secureFetchJson(`${baseUrl}/api/auth/update_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(form),
      });
      if (res?.status === 'success') {
        setStep(2);
      } else {
        alert(res?.message || '정보 입력에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLectureUpdate = async () => {
    setLoading(true);
    try {
      const res = await secureFetchJson(`${baseUrl}/api/lectures/update`, { method: 'POST' });
      if (res?.status === 'success') {
        setStep(3);
        setTimeout(() => {
          window.location.replace('/');
        }, 1200);
      } else {
        alert(res?.message || '강의목록 업데이트에 실패했습니다.\n정보를 다시 입력해주세요.');
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#f7f7f7"
    }}>
      <div style={{
        maxWidth: 480,
        width: "95vw",
        margin: "80px auto",
        padding: "44px 36px 38px 36px",
        background: "#fff",
        borderRadius: 22,
        boxShadow: "0 8px 32px rgba(34,34,34,0.08), 0 1.5px 6px rgba(0,0,0,0.04)"
      }}>
        {step === 1 && (
          <>
            <h2 style={{ marginBottom: 22, fontWeight: 800, color: "#222", fontSize: 26, letterSpacing: "-1px" }}>회원정보 입력</h2>
            <p style={{ color: "#888", marginBottom: 34, fontSize: 16, fontWeight: 500, lineHeight: 1.6 }}>최초 로그인 사용자입니다.<br />정보를 입력해주세요.</p>
            <form onSubmit={handleProfileSubmit} autoComplete="off">
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, display: "block", color: "#222" }}>이름</label>
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => handleKeyDown(e, idRef)}
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    borderRadius: 18,
                    border: "1.8px solid #ededed",
                    fontSize: 17,
                    outline: "none",
                    background: "#fafafa",
                    boxShadow: "0 1.5px 6px rgba(34,34,34,0.04)",
                    transition: "border 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={e => {
                    e.target.style.border = "1.8px solid #222";
                    e.target.style.background = "#fff";
                    e.target.style.boxShadow = "0 2px 8px rgba(34,34,34,0.10)";
                  }}
                  onBlur={e => {
                    e.target.style.border = "1.8px solid #ededed";
                    e.target.style.background = "#fafafa";
                    e.target.style.boxShadow = "0 1.5px 6px rgba(34,34,34,0.04)";
                  }}
                  autoComplete="off"
                />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, display: "block", color: "#222" }}>학번</label>
                <input
                  ref={idRef}
                  type="text"
                  placeholder="학번을 입력하세요"
                  value={form.student_id}
                  onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                  onKeyDown={e => handleKeyDown(e, pwRef)}
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    borderRadius: 18,
                    border: "1.8px solid #ededed",
                    fontSize: 17,
                    outline: "none",
                    background: "#fafafa",
                    boxShadow: "0 1.5px 6px rgba(34,34,34,0.04)",
                    transition: "border 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={e => {
                    e.target.style.border = "1.8px solid #222";
                    e.target.style.background = "#fff";
                    e.target.style.boxShadow = "0 2px 8px rgba(34,34,34,0.10)";
                  }}
                  onBlur={e => {
                    e.target.style.border = "1.8px solid #ededed";
                    e.target.style.background = "#fafafa";
                    e.target.style.boxShadow = "0 1.5px 6px rgba(34,34,34,0.04)";
                  }}
                  autoComplete="off"
                />
              </div>
              <div style={{ marginBottom: 32, position: "relative" }}>
                <label style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, display: "block", color: "#222" }}>PLATO 비밀번호</label>
                <input
                  ref={pwRef}
                  type={showPw ? "text" : "password"}
                  placeholder="PLATO 비밀번호"
                  value={form.student_password}
                  onChange={e => setForm(f => ({ ...f, student_password: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleProfileSubmit(e); }}
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    borderRadius: 18,
                    border: "1.8px solid #ededed",
                    fontSize: 17,
                    outline: "none",
                    background: "#fafafa",
                    boxShadow: "0 1.5px 6px rgba(34,34,34,0.04)",
                    transition: "border 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={e => {
                    e.target.style.border = "1.8px solid #222";
                    e.target.style.background = "#fff";
                    e.target.style.boxShadow = "0 2px 8px rgba(34,34,34,0.10)";
                  }}
                  onBlur={e => {
                    e.target.style.border = "1.8px solid #ededed";
                    e.target.style.background = "#fafafa";
                    e.target.style.boxShadow = "0 1.5px 6px rgba(34,34,34,0.04)";
                  }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute", right: 14, top: 44,
                    background: "none", border: "none",
                    cursor: "pointer", color: "#888", fontSize: 18, padding: 0
                  }}
                  tabIndex={-1}
                  aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
              <div style={{ marginBottom: 18, marginTop: 8, display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  id="agree-privacy"
                  checked={agree}
                  onChange={e => setAgree(e.target.checked)}
                  style={{ width: 18, height: 18, marginRight: 8, accentColor: "#2563eb" }}
                />
                <label htmlFor="agree-privacy" style={{ fontSize: 15, color: "#444", cursor: "pointer" }}>
                  <span>
                    <b>개인정보 처리방침</b>에 동의합니다.
                  </span>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: 8,
                      color: "#2563eb",
                      textDecoration: "underline",
                      fontWeight: 600,
                      fontSize: 15
                    }}
                    tabIndex={-1}
                  >
                    [내용 보기]
                  </a>
                </label>
              </div>
              <button
                type="submit"
                disabled={loading || !agree}
                style={{
                  width: "100%",
                  padding: "15px 0",
                  borderRadius: 18,
                  background: loading || !agree ? "#bbb" : "#222",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1.18em",
                  border: "none",
                  marginTop: 10,
                  cursor: loading || !agree ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px #ededed",
                  transition: "background 0.2s"
                }}
              >
                {loading ? "저장 중..." : "정보 제출"}
              </button>
            </form>
          </>
        )}
        {step === 2 && (
          <>
            <h2 style={{ marginBottom: 20, fontWeight: 800, color: "#222", fontSize: 24 }}>강의목록 업데이트</h2>
            <p style={{ color: "#888", marginBottom: 32, fontSize: 16, fontWeight: 500, lineHeight: 1.6 }}>정보 입력이 완료되었습니다.<br />이제 아래 버튼을 눌러 강의목록을 불러와 주세요.</p>
            <button onClick={handleLectureUpdate} disabled={loading} style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 18,
              background: "#222",
              color: "#fff",
              fontWeight: 800,
              fontSize: "1.13em",
              border: "none",
              boxShadow: "0 2px 8px #ededed",
              cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "업데이트 중..." : "강의목록 업데이트"}
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h2 style={{ marginBottom: 20, fontWeight: 800, color: "#222", fontSize: 24 }}>완료!</h2>
            <p style={{ color: "#888", marginBottom: 32, fontSize: 16, fontWeight: 500, lineHeight: 1.6 }}>강의목록이 업데이트되었습니다.<br />잠시 후 홈으로 이동합니다.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
