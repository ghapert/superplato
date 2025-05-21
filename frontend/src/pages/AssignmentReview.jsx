import React, { useState } from 'react';
import { secureFetchJson } from '../api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const SUPPORTED_EXTS = [
  // 텍스트
  '.txt', '.md', '.py', '.java', '.c', '.cpp', '.csv', '.json', '.html', '.js', '.ts', '.css',
  // PDF
  '.pdf',
  // 이미지
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'
];

function isSupportedFile(file) {
  if (!file) return false;
  const lower = file.name.toLowerCase();
  return SUPPORTED_EXTS.some(ext => lower.endsWith(ext));
}

const GPT_MODELS = [
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "o1-pro", label: "o1-Pro (최고급 모델)" }
];

const AssignmentReview = () => {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [raw, setRaw] = useState(null); // o1-pro 등에서 원본 응답 확인용

  const handleFileChange = e => {
    const f = e.target.files[0];
    setFile(f || null);
    setAnswer('');
    setError('');
    setRaw(null);
    if (f && !isSupportedFile(f)) {
      setError(`지원하지 않는 파일 형식입니다. (${SUPPORTED_EXTS.join(', ')})`);
    }
  };

  const handleQuestionChange = e => {
    setQuestion(e.target.value);
    setAnswer('');
    setError('');
    setRaw(null);
  };

  const handleModelChange = e => {
    setModel(e.target.value);
    setAnswer('');
    setError('');
    setRaw(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setAnswer('');
    setError('');
    setRaw(null);
    if (!question.trim()) {
      setError('질문을 입력해 주세요.');
      return;
    }
    if (file && !isSupportedFile(file)) {
      setError(`지원하지 않는 파일 형식입니다. (${SUPPORTED_EXTS.join(', ')})`);
      return;
    }
    // 파일 크기 제한 (예: 8MB)
    if (file && file.size > 8 * 1024 * 1024) {
      setError('파일 크기는 최대 8MB까지 업로드할 수 있습니다.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('question', question);
      formData.append('model', model);
      if (file) formData.append('file', file);

      // secureFetchJson 사용
      const data = await secureFetchJson(`${baseUrl}/api/chat/gpt`, {
        method: 'POST',
        body: formData,
      });
      if (!data) {
        setError('Pro 회원만 이용할 수 있습니다. 로그인 후 다시 시도해 주세요.');
        setLoading(false);
        return;
      }
      if (data.status === 'success') {
        setAnswer(data.answer);
        setRaw(data.raw || null);
      } else {
        setError(data.detail || data.message || '오류가 발생했습니다.');
      }
    } catch (err) {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg" style={{ minHeight: "100vh", background: "#f4f7fb" }}>
      <div
        className="assignment-review-card"
        style={{
          maxWidth: 520,
          margin: "48px auto 32px auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(52,152,219,0.08)",
          padding: "36px 28px 32px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <h1 style={{ fontSize: 25, marginBottom: 18, color: "#2563eb", fontWeight: 700, letterSpacing: -1 }}>
          과제 검수 <span style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>(AI 활용)</span>
        </h1>
        <form onSubmit={handleSubmit} style={{ marginBottom: 0 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500, color: "#222" }}>
              과제 파일 업로드 (선택)
              <span style={{ color: "#64748b", fontSize: 13, marginLeft: 8 }}>
                ({SUPPORTED_EXTS.join(', ')})
              </span>
            </label>
            <div style={{ marginTop: 8 }}>
              <label
                htmlFor="assignment-file"
                style={{
                  display: "inline-block",
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(52,152,219,0.08)",
                  border: "none",
                  transition: "background 0.15s"
                }}
              >
                파일 선택
                <input
                  id="assignment-file"
                  type="file"
                  accept={SUPPORTED_EXTS.join(',')}
                  onChange={handleFileChange}
                  style={{
                    display: "none"
                  }}
                />
              </label>
              {file && (
                <span style={{ fontSize: 13, color: "#2563eb", marginLeft: 12 }}>
                  선택됨: {file.name}
                </span>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500, color: "#222" }}>질문</label>
            <textarea
              value={question}
              onChange={handleQuestionChange}
              rows={3}
              style={{
                width: "100%",
                marginTop: 8,
                borderRadius: 8,
                border: "1.5px solid #dbeafe",
                padding: 12,
                fontSize: 15,
                resize: "vertical",
                background: "#fafdff"
              }}
              placeholder="과제에 대해 궁금한 점을 입력하세요."
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500, color: "#222" }}>GPT 모델 선택</label>
            <select
              value={model}
              onChange={handleModelChange}
              style={{
                width: "100%",
                marginTop: 8,
                borderRadius: 8,
                border: "1.5px solid #dbeafe",
                padding: 10,
                fontSize: 15,
                background: "#fafdff"
              }}
            >
              {GPT_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 8,
              background: loading ? "#93c5fd" : "#2563eb",
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 6,
              marginBottom: 2,
              boxShadow: "0 1px 4px rgba(52,152,219,0.06)"
            }}
          >
            {loading ? "검수 중..." : "검수 요청"}
          </button>
        </form>
        {error && (
          <div style={{ color: "#e11d48", marginTop: 14, textAlign: "center", fontSize: 15 }}>
            {error}
          </div>
        )}
        {answer && (
          <div
            style={{
              marginTop: 28,
              background: "#f1f5f9",
              borderRadius: 8,
              padding: 18,
              color: "#222",
              maxHeight: 360,
              minHeight: 80,
              overflowY: "auto",
              fontSize: 15.5,
              lineHeight: 1.7,
              boxShadow: "0 1px 4px rgba(52,152,219,0.04)",
              border: "1px solid #e0e7ef",
              wordBreak: "break-word"
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#2563eb" }}>AI 답변</div>
            <div style={{ whiteSpace: "pre-line" }}>{answer}</div>
            {raw && (
              <details style={{ marginTop: 16, fontSize: 13, color: "#888" }}>
                <summary>원본 응답(JSON)</summary>
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 200, overflowY: "auto" }}>
                  {JSON.stringify(raw, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentReview;
