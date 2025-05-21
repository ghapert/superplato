import React from 'react';
import { Link } from 'react-router-dom';

const ADMIN_LINKS = [
  { to: "/admin/prokeys", label: "🔑 ProKey 관리" },
  { to: "/admin/users", label: "👥 사용자 관리" },
  { to: "/admin/user-runners", label: "📋 사용자 출석강의 관리" },
  { to: "/admin/lecture", label: "📚 강의 상세 검색" },
];

const AdminDashboard = () => (
  <div className="page-bg">
    <div className="card" style={{ maxWidth: 600, margin: "40px auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24, fontWeight: 700 }}>관리자 대시보드</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {ADMIN_LINKS.map(link => (
          <li key={link.to} style={{ marginBottom: 18 }}>
            <Link
              to={link.to}
              style={{
                display: "block",
                fontSize: 18,
                fontWeight: 600,
                color: "#2563eb",
                background: "#f1f5f9",
                borderRadius: 8,
                padding: "16px 20px",
                textDecoration: "none",
                boxShadow: "0 1px 4px rgba(52,152,219,0.06)"
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default AdminDashboard;
