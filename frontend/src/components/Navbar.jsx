import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { to: "/", label: "🏠 홈" },
  { to: "/lectures/all", label: "📚 전체 강의" },
  { to: "/lectures/manage", label: "🗺️ 강의 관리" },
  { to: "/attendance/logs", label: "📝 내 출석 기록" },
  { to: "/account/edit", label: "👤 계정 관리" },
  { to: "/brute-attend-options", label: "🛠️ Pro 출석 관리", proOnly: true },
  { to: "/pro-ad", label: "🚀 About SuperPlato Pro", proHide: true },
  { to: "/assignment/review", label: "🧑‍💻 과제 검수", proOnly: true },
  // 관리자 대시보드만 관리자에게 노출
  { to: "/admin/dashboard", label: "🛡️ 관리자 대시보드", adminOnly: true },
  // ...기존 관리자 메뉴는 대시보드에서만 접근
];

const Navbar = ({ isAdmin, isPro }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <nav className="navbar">
      <div
        className="navbar-menu-icon"
        style={{ marginRight: "auto", fontSize: 26, paddingLeft: 24, cursor: "pointer", position: "relative" }}
        onClick={() => setOpen(v => !v)}
        ref={menuRef}
        tabIndex={0}
        aria-label="메뉴 열기"
      >
        <span aria-label="메뉴" role="img">☰</span>
        {open && (
          <div className="navbar-dropdown">
            {NAV_LINKS
              .filter(link =>
                (!link.adminOnly || isAdmin) &&
                (!link.proOnly || isPro) &&
                (!link.proHide || !isPro) // proHide가 true면 isPro가 false일 때만 보임
              )
              .map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="navbar-link"
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    fontSize: "0.98em",
                    whiteSpace: "nowrap",
                    color: "#222"
                  }}
                >
                  {link.label}
                </Link>
              ))}
          </div>
        )}
      </div>
      {/* 오른쪽 메뉴 항목 제거 */}
    </nav>
  );
};

export default Navbar;