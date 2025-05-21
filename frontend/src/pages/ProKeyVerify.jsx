import React, { useState, useEffect } from 'react';
import { secureFetchJson } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const ProKeyVerify = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setMessage('ProKey를 입력하세요.');
      setSuccess(false);
      return;
    }
    setLoading(true);
    setMessage('');
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('api_key', apiKey);
      const res = await secureFetchJson(`${baseUrl}/api/auth/verify_pro_key`, {
        method: 'POST',
        body: formData,
      });
      if (res?.status === 'success') {
        setSuccess(true);
        setMessage(res.message || 'ProKey가 정상적으로 적용되었습니다.');
      } else {
        setMessage(res?.message || '인증 실패');
      }
    } catch (err) {
      setMessage('인증 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.location.href = '/'; // 새로고침하며 홈으로 이동
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!agreed) {
    return (
      <div className="page-bg">
        <div
          className="card"
          style={{
            maxWidth: 480,
            margin: "40px auto",
            padding: "38px 30px 32px 30px",
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 4px 24px rgba(25,118,210,0.07)",
            fontSize: 16,
            lineHeight: 1.8,
            color: "#222"
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 22, color: "#d32f2f", marginBottom: 18 }}>
            ⚠️ Pro 기능 이용 전 유의사항
          </div>
          <div style={{ marginBottom: 18, color: "#444", fontWeight: 500 }}>
            SuperPlato의 Pro 기능은 출결 자동화 및 관련 편의 기능을 제공합니다.<br />
            본 기능은 외부 시스템과의 연동을 통해 자동 출석을 시도하며, 다음 사항에 동의하셔야 사용이 가능합니다:
          </div>
          <ul style={{ marginLeft: 18, marginBottom: 18, color: "#333" }}>
            <li>본 기능의 사용으로 인해 발생할 수 있는 출결 누락, 지각 처리, 학점 손실, 또는 교칙 위반 등의 문제에 대해 운영기관은 책임지지 않습니다.</li>
            <li>사용자는 해당 기능이 학교의 출결 정책과 상충할 수 있음을 인지하고, 자발적인 선택에 따라 기능을 활성화합니다.</li>
            <li>본 기능은 실험적 기술을 기반으로 하며, 100% 정확성을 보장하지 않습니다.</li>
          </ul>
          <div style={{ marginBottom: 24, color: "#1976d2", fontWeight: 600 }}>
            위 사항에 동의하고 Pro 기능을 사용하시겠습니까?
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button
              className="button"
              style={{ background: "#1976d2", color: "#fff", fontWeight: 700, minWidth: 120 }}
              onClick={() => setAgreed(true)}
            >
              동의합니다.
            </button>
            <button
              className="button"
              style={{ background: "#eee", color: "#888", fontWeight: 700, minWidth: 120 }}
              onClick={() => {
                alert("동의하지 않으면 Pro 기능을 이용하실 수 없습니다. 홈으로 이동합니다.");
                navigate('/');
              }}
            >
              동의하지 않습니다.
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <div
        className="card"
        style={{
          maxWidth: 400,
          margin: "20px auto 40px auto", // 상단 여백을 줄이고 하단 여백을 늘림
        }}
      >
        <h1 style={{ color: "#444", fontWeight: 800, fontSize: "1.2em", marginBottom: 18 }}>ProKey 인증</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="ProKey를 입력하세요"
            style={{ width: "100%", padding: 10, fontSize: 16, marginBottom: 16, borderRadius: 6, border: "1px solid #ddd" }}
            disabled={loading || success}
            required
          />
          <button
            type="submit"
            className="button"
            style={{ width: "100%" }}
            disabled={loading || success}
          >
            {loading ? "인증 중..." : "ProKey 인증"}
          </button>
        </form>
        {message && (
          <div style={{ marginTop: 18, color: success ? "#1976d2" : "#d00", textAlign: "center" }}>
            {message}
            {success && <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>잠시 후 홈으로 이동합니다...</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProKeyVerify;
