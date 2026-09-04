import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/profile/UserProfileModal';

const AppContent = ({ theme, toggleTheme }) => {
  const { isAuthenticated, loadingUser } = useAuth();

  return (
    <div className="app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <div style={{ flex: 1 }}>
        {loadingUser ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            Loading NotionFlow...
          </div>
        ) : isAuthenticated ? (
          <DashboardPage />
        ) : (
          <LandingPage />
        )}
      </div>

      <Footer />
      <AuthModal />
      <UserProfileModal />
    </div>
  );
};

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('notionflow_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('notionflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent theme={theme} toggleTheme={toggleTheme} />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
