import { useState, useEffect } from 'react';
import { auth, provider, secureFetchJson } from '../api/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('jwt', token);
        const userInfo = await secureFetchJson('/api/auth/me');
        setUser(userInfo);
      } else {
        setUser(null);
        localStorage.removeItem('jwt');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    localStorage.setItem('jwt', token);
    const userInfo = await secureFetchJson('/api/auth/me');
    setUser(userInfo);
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    localStorage.removeItem('jwt');
  };

  return { user, loading, login, logout };
};