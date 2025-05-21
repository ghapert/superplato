import React, { useState, useEffect } from 'react';
import { secureFetchJson } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AttendanceForm = ({ disabled, message, isPro }) => {
  const [authCode, setAuthCode] = useState('');
  const [localMessage, setLocalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bruteLoading, setBruteLoading] = useState(false);
  const navigate = useNavigate();

  const isValid = /^\d{3}$/.test(authCode);

  useEffect(() => {
    if (disabled) setAuthCode('');
  }, [disabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalMessage('');

    if (!/^\d{3}$/.test(authCode)) {
      setLocalMessage('❌ 출석 코드는 숫자 3자리여야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const result = await secureFetchJson(`${baseUrl}/api/attendance/auto_attend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auth_code: authCode }),
      });

      if (!result) {
        setLocalMessage('❌ 서버로부터 응답이 없습니다.');
        return;
      }

      setLocalMessage(result.status === 'success' ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch (err) {
      console.error('출석 요청 실패:', err);
      setLocalMessage('출석 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBruteforce = async () => {
    if (!window.confirm(
      "브루트포스 출석은 000~999 모든 코드를 자동으로 시도합니다.\n\n" +
      "이 기능은 PLATO 출석코드를 모를 때만 사용하세요.\n\n" +
      "시도하시겠습니까?"
    )) return;

    setBruteLoading(true);
    setLocalMessage('');
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const result = await secureFetchJson(`${baseUrl}/api/attendance/bruteforce_attend`, {
        method: 'POST'
      });
      setLocalMessage(
        result?.status === 'success'
          ? `✅ ${result.message}`
          : `❌ ${result?.message || '브루트포스 출석 실패'}`
      );
    } catch (err) {
      setLocalMessage('❌ 브루트포스 출석 요청에 실패했습니다.');
    } finally {
      setBruteLoading(false);
    }
  };

  if (disabled) {
    return (
      <div className="attendance-status-msg">
        {message && <p>{message}</p>}
      </div>
    );
  }

  let descClass = "attendance-form-desc";
  let descStyle = {};
  if (authCode.length === 0) {
    descClass += " neutral";
  } else if (/^\d{3}$/.test(authCode)) {
    descClass += " success";
    descStyle.color = "#43a047"; // 초록색
    descStyle.fontWeight = 700;
  } else {
    descClass += " error";
    descStyle.color = "#d32f2f"; // 빨간색
    descStyle.fontWeight = 700;
  }

  return (
    <form onSubmit={handleSubmit} className="attendance-form">
      <div className="attendance-form-row">
        <input
          type="text"
          placeholder="출석 코드 입력"
          value={authCode}
          onChange={(e) => setAuthCode(e.target.value)}
          required
          className="attendance-form-input"
          maxLength={3}
          inputMode="numeric"
          pattern="\d{3}"
          aria-describedby="attendance-code-desc"
          disabled={bruteLoading}
        />
        <button
          type="submit"
          className="button attendance-form-btn"
          disabled={loading || bruteLoading}
        >
          {bruteLoading
            ? "브루트포스 시도중..."
            : loading
              ? "제출중..."
              : "제출"}
        </button>
      </div>
      <div
        id="attendance-code-desc"
        className={descClass}
        style={descStyle}
      >
        출석 코드는 숫자 3자리여야 합니다.
      </div>
      <div className="attendance-form-helper">
        {isPro ? (
          <a
            href="#"
            className="attendance-form-helper-link"
            onClick={e => {
              e.preventDefault();
              handleBruteforce();
            }}
          >
            출석코드를 모르시나요?
          </a>
        ) : (
          <a
            href="#"
            className="attendance-form-helper-link"
            style={{ color: "#ff9800", fontWeight: 700 }}
            onClick={e => {
              e.preventDefault();
              navigate('/pro-ad');
            }}
          >
            출석코드를 모르시나요? <span style={{ color: "#1976d2" }}>지금 SuperPlato Pro 시작하기</span>
          </a>
        )}
      </div>
      {localMessage && (
        <p className={`attendance-form-msg${localMessage.startsWith('✅') ? ' success' : ' error'}`}>
          {localMessage}
        </p>
      )}
    </form>
  );
};

export default AttendanceForm;