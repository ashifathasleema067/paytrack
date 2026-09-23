import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setIsDemo(!!data.isDemo);
    } catch (err) {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleExpired = () => {
      setUser(null);
      addToast('Session expired. Please log in again.', 'error');
    };

    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setAuthToken(data.token);
    setUser(data.user);
    setIsDemo(data.user.email === 'alex@paytrack.dev');
    addToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');
    return data;
  };

  const demoLogin = async () => {
    const data = await api.demoLogin();
    setAuthToken(data.token);
    setUser(data.user);
    setIsDemo(true);
    addToast('Logged into Alex Morgan demo account with realistic sample data!', 'success');
    return data;
  };

  const signup = async (formData) => {
    const data = await api.signup(formData);
    setAuthToken(data.token);
    setUser(data.user);
    setIsDemo(false);
    addToast('Account created! Welcome to PayTrack.', 'success');
    return data;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setIsDemo(false);
    addToast('Logged out securely.', 'info');
  };

  const refreshUser = async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
    } catch (e) {
      console.error(e);
    }
  };

  const resetDemo = async () => {
    try {
      await api.resetDemoData();
      await refreshUser();
      addToast('Demo data restored to initial state!', 'success');
    } catch (e) {
      addToast('Failed to reset demo data: ' + e.message, 'error');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo,
      login,
      demoLogin,
      signup,
      logout,
      refreshUser,
      resetDemo,
      addToast,
      toasts,
      removeToast
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
