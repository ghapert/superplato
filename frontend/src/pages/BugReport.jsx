import React from 'react';

const BUG_REPORT_EMAIL = import.meta.env.VITE_BUG_REPORT_EMAIL;

const BugReport = () => (
  <div className="page-bg" style={{ minHeight: "100vh", padding: "40px 0" }}>
    <div className="card" style={{ maxWidth: 600, margin: "0 auto", padding: "40px 32px", fontSize: 16, lineHeight: 1.7 }}>
      <h1 style={{ fontWeight: 800, fontSize: 26, marginBottom: 24, color: "#1976d2" }}>SuperPlato 버그 신고</h1>
      <p style={{ marginBottom: 24 }}>
        서비스 이용 중 발견한 버그, 오류, 개선사항이 있다면 아래 버튼을 눌러 이메일로 알려주세요.<br />
        최대한 빠르게 확인 후 답변드리겠습니다.
      </p>
      <a
        href={`mailto:${BUG_REPORT_EMAIL}?subject=SuperPlato%20버그%20신고`}
        className="button"
        style={{
          display: "inline-block",
          padding: "14px 32px",
          background: "#1976d2",
          color: "#fff",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 18,
          textDecoration: "none",
          marginTop: 10
        }}
      >
        버그 신고하기
      </a>
      <div style={{ marginTop: 32, color: "#888", fontSize: 15 }}>
        문의: {BUG_REPORT_EMAIL}
      </div>
    </div>
  </div>
);

export default BugReport;
