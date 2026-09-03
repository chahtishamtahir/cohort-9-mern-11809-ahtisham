import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/profile/UserProfileModal';

const AppContent = ({ theme, toggleTheme }) => {
  const { isAuthenticated, loadingUser } = useAuth();
  const [view, setView] = useState('auto'); // 'auto' | 'landing' | 'dashboard'

  // Determine active view: if authenticated and 'auto', show dashboard
  const showDashboard = isAuthenticated && view !== 'landing';

  return (
    <div className="app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Sub-bar if authenticated to switch between Workspace & Landing */}
      {isAuthenticated && (
        <div
          style={{
            maxWidth: '1280px',
            width: '100%',
            margin: '12px auto 0',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px'
          }}
        >
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className={`btn btn-sm ${showDashboard ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--rounded-full)', fontSize: '0.8rem' }}
          >
            My Workspace
          </button>
          <button
            type="button"
            onClick={() => setView('landing')}
            className={`btn btn-sm ${!showDashboard ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--rounded-full)', fontSize: '0.8rem' }}
          >
            Product Overview
          </button>
        </div>
      )}

      <div style={{ flex: 1 }}>
        {loadingUser ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            Loading NotionFlow...
          </div>
        ) : showDashboard ? (
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
    <AuthProvider>
      <AppContent theme={theme} toggleTheme={toggleTheme} />
    </AuthProvider>
  );
}

export default App;
