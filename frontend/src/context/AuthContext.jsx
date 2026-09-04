import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { useToast } from './useToast';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signup'); // 'login' | 'signup'
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [noteCount, setNoteCount] = useState(0);

  const toast = useToast();

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
          toast.info('Your previous session has expired. Please log in again.');
        }
      }
      setLoadingUser(false);
    }
    restoreSession();
  }, [toast]);

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Please provide email and password.');
    }
    const res = await authApi.login(email, password);
    if (res && res.token) {
      localStorage.setItem('notionflow_token', res.token);
      setUser(res.user);
      setAuthModalOpen(false);
      toast.success(`Logged in successfully. Welcome back, ${res.user.name}!`);
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
      toast.success(`Account created successfully! Welcome to NotionFlow, ${res.user.name}.`);
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('notionflow_token');
    setUser(null);
    setProfileModalOpen(false);
    toast.info('You have been logged out of your workspace.');
  };

  const updateProfile = async (profileData) => {
    const res = await authApi.updateProfile(profileData);
    if (res && res.user) {
      setUser((prev) => ({ ...prev, ...res.user }));
      toast.success(res.message || 'Profile updated successfully.');
      return res.user;
    }
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
        updateProfile,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal,
        profileModalOpen,
        openProfileModal,
        closeProfileModal,
        noteCount,
        setNoteCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
