import React, { useEffect, useState } from 'react';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // fetchUsers 함수 분리
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/users`);
      setUsers(res?.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSetPro = async (userId, value) => {
    setMsg('');
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/users/${userId}/set_pro?value=${value}`, { method: 'POST' });
      setMsg(res?.message || '');
      await fetchUsers(); // 변경 후 목록 새로고침
    } catch {
      setMsg('권한 변경 실패');
    }
  };

  const handleSetAdmin = async (userId, value) => {
    setMsg('');
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/users/${userId}/set_admin?value=${value}`, { method: 'POST' });
      setMsg(res?.message || '');
      await fetchUsers(); // 변경 후 목록 새로고침
    } catch {
      setMsg('권한 변경 실패');
    }
  };

  return (
    <div className="page-bg" style={{ minHeight: "100vh", background: "#f4f7fb" }}>
      <div className="card" style={{
        maxWidth: 900,
        margin: "48px auto 32px auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(52,152,219,0.08)",
        padding: "36px 32px 32px 32px",
        display: "flex",
        flexDirection: "column"
      }}>
        <h1 style={{ fontSize: 24, marginBottom: 24, color: "#2563eb", fontWeight: 700, letterSpacing: -1 }}>
          사용자 관리
        </h1>
        {loading ? (
          <div style={{ color: "#888" }}>불러오는 중...</div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              overflowY: "auto",
              borderRadius: 8,
              background: "#fafdff",
              border: "1px solid #e5e7eb",
              maxHeight: 520,
              minHeight: 220
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>이름</th>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>학번</th>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>Pro</th>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>Admin</th>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>{u.id}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>{u.name}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>{u.student_id}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>
                      {u.is_pro
                        ? <span style={{ color: "#22c55e", fontWeight: 700 }}>✅</span>
                        : <span style={{ color: "#e11d48", fontWeight: 700 }}>❌</span>
                      }
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>
                      {u.is_admin
                        ? <span style={{ color: "#2563eb", fontWeight: 700 }}>✅</span>
                        : <span style={{ color: "#e11d48", fontWeight: 700 }}>❌</span>
                      }
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>
                      <button
                        onClick={() => handleSetPro(u.id, !u.is_pro)}
                        style={{
                          marginRight: 8,
                          background: u.is_pro ? "#f1f5f9" : "#22c55e",
                          color: u.is_pro ? "#222" : "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 14px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {u.is_pro ? "Pro 해제" : "Pro 부여"}
                      </button>
                      <button
                        onClick={() => handleSetAdmin(u.id, !u.is_admin)}
                        style={{
                          background: u.is_admin ? "#f1f5f9" : "#2563eb",
                          color: u.is_admin ? "#222" : "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 14px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {u.is_admin ? "Admin 해제" : "Admin 부여"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {msg && <div style={{ marginTop: 18, color: "#2563eb", fontWeight: 500, textAlign: "center" }}>{msg}</div>}
      </div>
    </div>
  );
};

export default AdminUsers;
