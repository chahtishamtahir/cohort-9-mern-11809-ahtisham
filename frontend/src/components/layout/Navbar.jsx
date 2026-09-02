import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, LogOut } from 'lucide-react';

export const Navbar = ({ theme, toggleTheme }) => {
  const { user, isAuthenticated, openAuthModal, openProfileModal, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="nav-pill-wrapper">
      <div className="nav-pill">
        {/* Brand: 30% squircle app icon + Wordmark */}
        <a 
          href="#" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <div className="app-icon-squircle">
            N
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 750, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            NotionFlow
          </span>
        </a>

        {/* Right side: Theme toggle, Log in, Sign up */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={openProfileModal}
                className="btn btn-soft btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {userInitial}
                </div>
                <span style={{ fontSize: '0.84rem' }}>{user.name}</span>
              </button>
              <button
                onClick={logout}
                className="btn btn-ghost btn-sm"
                title="Log out"
                style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => openAuthModal('login')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.86rem' }}
              >
                Log in
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.86rem' }}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
