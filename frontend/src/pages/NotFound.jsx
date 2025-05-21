import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
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
        fontSize: 72,
        fontWeight: 900,
        color: "#1976d2",
        marginBottom: 12,
        letterSpacing: "-2px",
      }}
    >
      404
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 18 }}>
      페이지를 찾을 수 없습니다
    </div>
    <div style={{ color: "#888", marginBottom: 32 }}>
      요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.
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

export default NotFound;
