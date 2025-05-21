import React, { useEffect, useState } from 'react';
import { secureFetchJson } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AccountForm = ({
  initialName = '',
  initialStudentId = '',
  isEditing: externalEditing,
  setIsEditing,
  onLogout,
  onDelete
}) => {
  const [name, setName] = useState(initialName);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [password, setPassword] = useState('');
  const [isEditing, setEditing] = useState(false);
  const navigate = useNavigate();

  // 외부에서 isEditing 제어시 내부 상태 동기화
  useEffect(() => {
    if (typeof externalEditing === 'boolean') setEditing(externalEditing);
  }, [externalEditing]);

  useEffect(() => {
    setName(initialName);
    setStudentId(initialStudentId);
    setPassword('');
  }, [initialName, initialStudentId]);

  const handleEditClick = (e) => {
    // 폼 submit이 일어나지 않도록 반드시 preventDefault 호출
    if (e && e.preventDefault) e.preventDefault();
    setEditing(true);
    if (setIsEditing) setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // isEditing이 아닐 때는 제출 자체를 막음 (이 줄이 반드시 맨 위에 있어야 함)
    if (!isEditing) return false;
    if (!name || !studentId) {
      alert('이름과 학번을 입력해주세요.');
      return;
    }
    const passwordToSend = password ? password : "__NO_CHANGE__";
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await secureFetchJson(`${baseUrl}/api/auth/update_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name,
          student_id: studentId,
          student_password: passwordToSend,
        }),
      });

      if (response.status === 'success') {
        alert(response.message || '정보가 성공적으로 수정되었습니다.');
        setEditing(false);
        if (setIsEditing) setIsEditing(false);
        setPassword('');
      } else {
        alert(response.message || '정보 수정에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 요청 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="account-form"
    >
      <div className="form-group">
        <label>이름<br />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={!isEditing}
            className="input"
          />
        </label>
      </div>
      <div className="form-group">
        <label>학번<br />
          <input
            type="text"
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            disabled={!isEditing}
            className="input"
          />
        </label>
      </div>
      <div className="form-group">
        <label>PLATO 비밀번호<br />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={!isEditing}
            className="input"
            placeholder="변경 시에만 입력"
          />
        </label>
      </div>
      <div className="form-actions">
        {!isEditing ? (
          <button
            type="button"
            onClick={handleEditClick}
            className="button edit-btn"
          >
            수정하기
          </button>
        ) : (
          <button
            type="submit"
            className="button save-btn"
          >
            저장하기
          </button>
        )}
      </div>
      <div className="account-form-bottom-actions">
        <button type="button" onClick={onLogout} className="button logout-btn">
          로그아웃
        </button>
        <button type="button" onClick={onDelete} className="button delete-btn">
          회원 탈퇴
        </button>
      </div>
    </form>
  );
};

export default AccountForm;