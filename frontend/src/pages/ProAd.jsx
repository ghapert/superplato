import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

const fadeInKeyframes = `
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(40px) scale(0.98);}
  100% { opacity: 1; transform: translateY(0) scale(1);}
}
`;

const ProAd = () => {
  // 동적으로 스타일 삽입 (최초 1회)
  const styleRef = useRef();
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.innerHTML = fadeInKeyframes;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    // cleanup: 스타일이 실제로 head에 있을 때만 제거
    return () => {
      if (styleRef.current && styleRef.current.parentNode === document.head) {
        document.head.removeChild(styleRef.current);
      }
      styleRef.current = null;
    };
  }, []);

  return (
    <div
      className="page-bg"
      style={{
        minHeight: "100vh",
        minHeight: "100dvh",
        width: "100vw",
        overflowY: "auto",
        display: "block",
        background: "#fff",
        position: "relative"
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          padding: "100px 5vw 100px 5vw", // 상하 패딩을 100px로 늘림
          textAlign: "center",
          animation: "fadeInUp 1.1s cubic-bezier(.23,1.01,.32,1) both"
        }}
      >
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: "#1976d2",
          marginBottom: 18,
          letterSpacing: -2,
          textShadow: "0 2px 16px #b6d0ff33",
          animation: "fadeInUp 1.3s 0.1s both"
        }}>
          SuperPlato <span style={{ color: "#ffb300", textShadow: "0 2px 16px #ffe9b633" }}>Pro</span>
        </div>
        <div style={{
          fontSize: 28,
          color: "#444",
          fontWeight: 700,
          marginBottom: 24,
          animation: "fadeInUp 1.3s 0.2s both"
        }}>
          단순한 출석이 아닙니다.<br />
          시간, 에너지, 불안 — 모두 자동화하세요.
        </div>
        <div style={{
          margin: "32px 0 24px 0",
          padding: "0",
          animation: "fadeInUp 1.3s 0.3s both"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: "#222" }}>
            SuperPlato Pro는 당신의 하루를 바꿉니다.<br />
            출석이 시작되면, 이미 순식간에 완료되어 있죠.<br />
            우리는 클릭조차 필요 없게 만들었습니다.
          </div>
          <ul style={{
            textAlign: "center",
            margin: "0 auto",
            maxWidth: 600,
            color: "#333",
            fontSize: "1.25em",
            lineHeight: 1.7,
            fontWeight: 500,
            display: "inline-block",
            animation: "fadeInUp 1.3s 0.4s both"
          }}>
            <li>✅ 완전 자동 출석</li>
            <li>✅ 시간표 기반 스마트 인식</li>
            <li>✅ 출석 성공 로그와 강의별 관리</li>
            <li>✅ Pro 전용 우선 기술 지원</li>
          </ul>
          <div style={{ marginTop: 28, color: "#888", fontSize: 18, fontWeight: 400 }}>
            더 적게 불안하고, 더 많이 집중하세요.
          </div>
        </div>
        <div style={{
          margin: "40px 0 24px 0",
          fontSize: 22,
          color: "#222",
          fontWeight: 600,
          animation: "fadeInUp 1.3s 0.5s both"
        }}>
          당신의 뇌가 잠든 사이,<br />
          브라우저가 깨어 출석을 대신합니다.<br />
          <span style={{ color: "#1976d2" }}>Playwright 기반 백그라운드 자동화</span>.<br />
          수업 시간 감지, 브루트포스 인증, 세션 유지까지.<br />
          더 이상 출석을 “기억”하지 마세요.<br />
          SuperPlato Pro가 모든 걸 처리합니다.
        </div>
        <div style={{
          margin: "40px 0 24px 0",
          fontSize: 28,
          color: "#1976d2",
          fontWeight: 900,
          animation: "fadeInUp 1.3s 0.6s both"
        }}>
          클릭하지 마세요.<br />
          Pro는 알아서 출석합니다.
        </div>
        <div style={{
          margin: "40px 0 24px 0",
          fontSize: 22,
          color: "#444",
          fontWeight: 700,
          animation: "fadeInUp 1.3s 0.7s both"
        }}>
          출석을 두려워하지 마세요.<br />
          Pro는 항상 제시간에 도착합니다.<br />
          <span style={{ color: "#ffb300" }}>🪙 지금 업그레이드하고<br />“출석 걱정 없는 학기”를 시작하세요.</span>
        </div>
        {/* 과제 검수 AI 광고 추가 - ProKey 등록 버튼 위로 이동 */}
        <div
          style={{
            marginTop: 48,
            padding: "32px 0 0 0",
            borderTop: "1.5px dashed #e0e7ef",
            textAlign: "center",
            animation: "fadeInUp 1.3s 1.0s both"
          }}
        >
          <div style={{ fontSize: 22, color: "#2563eb", fontWeight: 800, marginBottom: 10 }}>
            🧑‍💻 Pro 전용 AI 과제 검수
          </div>
          <div style={{ fontSize: 17, color: "#444", fontWeight: 500, marginBottom: 8 }}>
            txt, 코드, PDF, 이미지까지<br />
            업로드만 하면 AI가 과제 파일을 검토하고<br />
            궁금한 점에 친절하게 답변해줍니다.
          </div>
        </div>
        <Link
          to="/prokey/verify"
          className="button"
          style={{
            width: 340,
            maxWidth: "90vw",
            fontSize: 22,
            fontWeight: 700,
            padding: "20px 0",
            margin: "28px 0 12px 0",
            borderRadius: 16,
            background: "linear-gradient(90deg, #1976d2 60%, #ffb300 100%)",
            color: "#fff",
            boxShadow: "0 2px 16px rgba(25,118,210,0.13)",
            border: "none",
            transition: "transform 0.18s cubic-bezier(.4,1.2,.4,1), box-shadow 0.18s",
            animation: "fadeInUp 1.3s 0.8s both"
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = "scale(1.04)";
            e.currentTarget.style.boxShadow = "0 4px 32px #1976d244";
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 16px rgba(25,118,210,0.13)";
          }}
        >
          ProKey 등록하고 Pro 시작하기
        </Link>
        <div style={{
          color: "#888",
          fontSize: 17,
          marginTop: 16,
          animation: "fadeInUp 1.3s 0.9s both"
        }}>
          ProKey가 없으신가요? <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#1976d2", textDecoration: "underline" }}>문의하기</a>
        </div>
      </div>
    </div>
  );
};

export default ProAd;
