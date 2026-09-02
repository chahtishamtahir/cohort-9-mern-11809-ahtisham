import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('notionflow_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signup'); // 'login' | 'signup'
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('notionflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('notionflow_user');
    }
  }, [user]);

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Please provide email and password.');
    }
    const mockUser = {
      id: 'usr_' + Date.now(),
      name: email.split('@')[0],
      email: email,
      createdAt: new Date().toISOString(),
      notesCount: 4
    };
    setUser(mockUser);
    setAuthModalOpen(false);
    return mockUser;
  };

  const signup = async (name, email, password) => {
    if (!name || !email || !password) {
      throw new Error('Please fill in all fields.');
    }
    const mockUser = {
      id: 'usr_' + Date.now(),
      name: name,
      email: email,
      createdAt: new Date().toISOString(),
      notesCount: 1
    };
    setUser(mockUser);
    setAuthModalOpen(false);
    return mockUser;
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
