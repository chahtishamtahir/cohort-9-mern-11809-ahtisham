import React from 'react';
import { useAuth } from '../../context/useAuth';
import { Sun, Moon, LogOut } from 'lucide-react';

export const Navbar = ({ theme, toggleTheme }) => {
  const { user, isAuthenticated, openAuthModal, openProfileModal, logout } = useAuth();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const handleBrandClick = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="nav-pill-wrapper">
      <div className="nav-pill">
        {/* Brand: 30% squircle app icon + Wordmark */}
        <button
          type="button"
          onClick={handleBrandClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
            textAlign: 'left',
            flexShrink: 0
          }}
          title="NotionFlow Home"
        >
          <div className="app-icon-squircle">
            N
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 750, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            NotionFlow
          </span>
        </button>

        {/* Right side: Theme toggle, Log in, Sign up */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
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
                type="button"
                onClick={openProfileModal}
                className="btn btn-soft btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="View Profile"
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {userInitial}
                </div>
                <span className="nav-user-name" style={{ fontSize: '0.84rem' }}>
                  {user.name}
                </span>
              </button>
              <button
                type="button"
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
                type="button"
                onClick={() => openAuthModal('login')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.86rem' }}
              >
                Log in
              </button>
              <button
                type="button"
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
