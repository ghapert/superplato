import React, { useEffect, useState } from 'react';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const TYPE_LABELS = {
  0: { label: "일반 출석", color: "#1976d2" },
  1: { label: "Pro 수동 출석", color: "#ff9800" },
  2: { label: "Pro 자동 출석", color: "#43a047" }
};

const toKSTString = (log) => {
  if (!log) return '';
  const utcString = log.timestamp;
  if (!utcString) return '';
  const date = new Date(utcString.endsWith('Z') ? utcString : utcString + 'Z');
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const AttendanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await secureFetchJson(`${baseUrl}/api/attendance/logs`);
        if (res?.status === 'success') {
          setLogs(res.attendances || []);
        } else {
          setLogs([]);
        }
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="page-bg">
      <div className="card" style={{ maxWidth: 900, margin: "40px auto", padding: 32, minHeight: 400 }}>
        <h1 style={{ color: "#444", fontWeight: 800, fontSize: "1.3em", marginBottom: 18 }}>내 SuperPlato 출석 기록</h1>
        {loading ? (
          <div style={{ color: "#888" }}>불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: "#888" }}>출석 기록이 없습니다.</div>
        ) : (
          <div style={{
            border: "1.5px solid #e5e7eb",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(52,152,219,0.07)",
            background: "#fafdff"
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: 15,
              background: "#fafdff"
            }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{
                    padding: "12px 8px",
                    borderBottom: "2px solid #e5e7eb",
                    borderRight: "1px solid #e5e7eb",
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center"
                  }}>날짜/시간</th>
                  <th style={{
                    padding: "12px 8px",
                    borderBottom: "2px solid #e5e7eb",
                    borderRight: "1px solid #e5e7eb",
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center"
                  }}>강의명</th>
                  <th style={{
                    padding: "12px 8px",
                    borderBottom: "2px solid #e5e7eb",
                    borderRight: "1px solid #e5e7eb",
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center"
                  }}>출석 유형</th>
                  <th style={{
                    padding: "12px 8px",
                    borderBottom: "2px solid #e5e7eb",
                    fontWeight: 700,
                    color: "#2563eb",
                    textAlign: "center"
                  }}>인증코드</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} style={{
                    background: idx % 2 === 0 ? "#fff" : "#f4f7fb"
                  }}>
                    <td style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #e5e7eb",
                      borderRight: "1px solid #e5e7eb",
                      textAlign: "center",
                      color: "#222",
                      minWidth: 140,
                      fontFamily: "monospace"
                    }}>
                      {toKSTString(log)}
                    </td>
                    <td style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #e5e7eb",
                      borderRight: "1px solid #e5e7eb",
                      color: "#222",
                      minWidth: 160,
                      textAlign: "center"
                    }}>
                      {log.lecture_name || log.lecture_id}
                    </td>
                    <td style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #e5e7eb",
                      borderRight: "1px solid #e5e7eb",
                      textAlign: "center"
                    }}>
                      <span style={{
                        color: "#fff",
                        background: TYPE_LABELS[log.type]?.color || "#888",
                        borderRadius: 8,
                        padding: "3px 12px",
                        fontWeight: 700,
                        fontSize: 14,
                        display: "inline-block",
                        letterSpacing: 0.5
                      }}>
                        {TYPE_LABELS[log.type]?.label || "알 수 없음"}
                      </span>
                    </td>
                    <td style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #e5e7eb",
                      textAlign: "center",
                      color: "#222",
                      fontFamily: "monospace",
                      minWidth: 100
                    }}>
                      {log.auth_code ?? "-"}
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

export default AttendanceLogs;
