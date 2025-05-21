import React, { useEffect, useState } from 'react';
import AppRouter from './routes/AppRouter.jsx';
import { secureFetchJson } from './api/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

function App() {
  const [userStatus, setUserStatus] = useState(undefined); // 'loading' | 'none' | 'onboarding' | 'ready'
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      setUserStatus('none');
      setIsAdmin(false);
      setIsPro(false);
      return;
    }
    (async () => {
      try {
        const res = await secureFetchJson(`${baseUrl}/api/auth/me`);
        if (!res) {
          setUserStatus('none');
          setIsAdmin(false);
          setIsPro(false);
        } else if (!res.student_id || !res.student_password) {
          setUserStatus('onboarding');
          setIsAdmin(!!res.is_admin);
          setIsPro(!!res.is_pro);
        } else {
          setUserStatus('ready');
          setIsAdmin(!!res.is_admin);
          setIsPro(!!res.is_pro);
        }
      } catch {
        setUserStatus('none');
        setIsAdmin(false);
        setIsPro(false);
      }
    })();
  }, []);

  if (userStatus === undefined) return null; // 로딩 중

  return (
    <AppRouter
      isLoggedIn={userStatus === 'ready'}
      onboarding={userStatus === 'onboarding'}
      isAdmin={isAdmin}
      isPro={isPro}
    />
  );
}

export default App;
