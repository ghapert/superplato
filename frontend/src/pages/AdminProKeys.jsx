import React, { useEffect, useState } from 'react';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const AdminProKeys = () => {
  const [proKeys, setProKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genCount, setGenCount] = useState(10);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProKeys = async () => {
    setLoading(true);
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/prokeys`);
      setProKeys(res?.prokeys || []);
    } catch {
      setProKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProKeys();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/prokeys?count=${genCount}`, {
        method: 'POST',
      });
      if (res?.created) {
        setMessage(`${res.created.length}개의 ProKey가 생성되었습니다.`);
        fetchProKeys();
      } else {
        setMessage('생성 실패');
      }
    } catch {
      setMessage('생성 중 오류 발생');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`정말로 프로키 ${key}를 삭제하시겠습니까?`)) return;
    setMessage('');
    try {
      const res = await secureFetchJson(`${baseUrl}/api/admin/prokeys/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      if (res?.status === 'success') {
        await fetchProKeys();
        setMessage(res.message || '삭제되었습니다.');
      } else {
        setMessage(res?.message || '삭제 실패');
      }
    } catch {
      setMessage('삭제 중 오류 발생');
    }
  };

  return (
    <div className="page-bg" style={{ minHeight: "100vh", background: "#f4f7fb" }}>
      <div
        className="card"
        style={{
          maxWidth: 600,
          margin: "48px auto 32px auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(52,152,219,0.08)",
          padding: "36px 32px 32px 32px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 24, color: "#2563eb", fontWeight: 700, letterSpacing: -1 }}>
          ProKey 관리
        </h1>
        <form onSubmit={handleGenerate} style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontWeight: 500, color: "#222" }}>
            생성 개수
            <input
              type="number"
              min={1}
              max={100}
              value={genCount}
              onChange={e => setGenCount(Number(e.target.value))}
              style={{
                width: 60,
                marginLeft: 10,
                border: "1.5px solid #dbeafe",
                borderRadius: 7,
                padding: "7px 10px",
                fontSize: 15,
                background: "#fafdff"
              }}
              disabled={creating}
            />
          </label>
          <button
            type="submit"
            className="button"
            disabled={creating}
            style={{
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 7,
              padding: "9px 22px",
              fontSize: 16,
              border: "none",
              cursor: creating ? "not-allowed" : "pointer"
            }}
          >
            {creating ? "생성 중..." : "ProKey 생성"}
          </button>
        </form>
        {message && <div style={{ marginBottom: 18, color: "#2563eb", fontWeight: 500, textAlign: "center" }}>{message}</div>}
        <h2 style={{ fontSize: 18, marginBottom: 14, color: "#222", fontWeight: 600 }}>ProKey 목록</h2>
        {loading ? (
          <div style={{ color: "#888" }}>불러오는 중...</div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafdff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>Key</th>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>상태</th>
                  <th style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {proKeys.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: "#888", textAlign: "center", padding: 18 }}>ProKey가 없습니다.</td>
                  </tr>
                )}
                {proKeys.map(pk => (
                  <tr key={pk.key}>
                    <td style={{ fontFamily: "monospace", padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>{pk.key}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>
                      {pk.is_used
                        ? <span style={{ color: "#e11d48", fontWeight: 600 }}>사용됨<br /><span style={{ fontWeight: 400, fontSize: 13 }}>{pk.used_by ?? "?"}, {pk.used_at ? new Date(pk.used_at).toLocaleString() : "시간 없음"}</span></span>
                        : <span style={{ color: "#22c55e", fontWeight: 600 }}>미사용</span>
                      }
                    </td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>
                      <button
                        onClick={() => handleDelete(pk.key)}
                        style={{
                          background: "#fff",
                          border: "1px solid #eee",
                          borderRadius: 5,
                          color: "#e11d48",
                          cursor: "pointer",
                          padding: "4px 14px",
                          fontSize: 14,
                          fontWeight: 600
                        }}
                        disabled={creating}
                        type="button"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProKeys;
