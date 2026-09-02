import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signup'); // 'login' | 'signup'
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Please provide email and password.');
    }
    // Real backend authentication will be connected in the backend auth phase
    setAuthModalOpen(false);
  };

  const signup = async (name, email, password) => {
    if (!name || !email || !password) {
      throw new Error('Please fill in all fields.');
    }
    // Real backend registration will be connected in the backend auth phase
    setAuthModalOpen(false);
  };

  const logout = () => {
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
