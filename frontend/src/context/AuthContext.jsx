import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signup'); // 'login' | 'signup'
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Restore user session on mount
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('notionflow_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res && res.user) {
            setUser(res.user);
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('notionflow_token');
          setUser(null);
        }
      }
      setLoadingUser(false);
    }
    restoreSession();
  }, []);

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Please provide email and password.');
    }
    const res = await authApi.login(email, password);
    if (res && res.token) {
      localStorage.setItem('notionflow_token', res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res.user;
    }
  };

  const signup = async (name, email, password) => {
    if (!name || !email || !password) {
      throw new Error('Please fill in all fields.');
    }
    const res = await authApi.signup(name, email, password);
    if (res && res.token) {
      localStorage.setItem('notionflow_token', res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('notionflow_token');
    setUser(null);
    setProfileModalOpen(false);
  };

  const openAuthModal = (mode = 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const openProfileModal = () => {
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loadingUser,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
        profileModalOpen,
        openProfileModal,
        closeProfileModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
