import React from "react";
import { Link } from "react-router-dom";

const Forbidden = () => (
  <div
    className="page-bg"
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#fafdff",
      color: "#222",
    }}
  >
    <div
      style={{
        fontSize: 56,
        fontWeight: 900,
        color: "#d32f2f",
        marginBottom: 12,
        letterSpacing: "-2px",
      }}
    >
      권한 없음
    </div>
    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>
      이 페이지에 접근할 권한이 없습니다.
    </div>
    <div style={{ color: "#888", marginBottom: 32 }}>
      로그인 상태 또는 권한을 확인해 주세요.
    </div>
    <Link
      to="/"
      style={{
        background: "#1976d2",
        color: "#fff",
        padding: "10px 28px",
        borderRadius: 8,
        fontWeight: 700,
        textDecoration: "none",
        fontSize: 16,
      }}
    >
      홈으로 이동
    </Link>
  </div>
);

export default Forbidden;
