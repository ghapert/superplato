import React, { useEffect, useState } from 'react';
import { secureFetchJson, logout as logoutFn } from '../api/auth';
import AccountForm from '../components/AccountForm';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const AccountEdit = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await secureFetchJson(`${baseUrl}/api/auth/me`);
        if (data) setUserData(data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutFn();
      window.location.href = '/';
    } catch (err) {
      alert('로그아웃 실패');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      const response = await secureFetchJson(`${baseUrl}/api/account/delete`, { method: 'POST' });
      await logoutFn(); // 탈퇴 성공/실패와 관계없이 토큰 폐기
      alert(response?.message || '회원 탈퇴 처리 중 오류가 발생했습니다.');
      window.location.href = '/';
    } catch (err) {
      await logoutFn(); // 예외 발생 시에도 토큰 폐기
      alert('회원 탈퇴 처리 중 오류가 발생했습니다.');
      window.location.href = '/';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="page-bg">
      <div className="account-edit-card">
        <h1 className="account-edit-title">내 정보 수정</h1>
        <div className="account-edit-form-wrapper">
          {userData && (
            <div className="account-edit-form-inner">
              <AccountForm
                initialName={userData.name}
                initialStudentId={userData.student_id}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onLogout={handleLogout}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountEdit;