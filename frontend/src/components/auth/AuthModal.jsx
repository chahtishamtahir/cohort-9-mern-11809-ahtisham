import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, AlertCircle } from 'lucide-react';

export const AuthModal = () => {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuthModal,
    login,
    signup
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authModalMode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.includes('@') || !email.includes('.')) throw new Error('Please enter a valid email address.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        await signup(name, email, password);
      } else {
        if (!email || !password) throw new Error('Please enter both email and password.');
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="btn btn-ghost btn-sm"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '6px',
            borderRadius: 'var(--rounded-full)'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="app-icon-squircle"
            style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 12px',
              fontSize: '1.1rem'
            }}
          >
            N
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
            {authModalMode === 'signup' ? 'Create an account.' : 'Log in to NotionFlow.'}
          </h2>
          <p className="small-text" style={{ marginTop: '4px' }}>
            {authModalMode === 'signup'
              ? 'Enter your details to start taking notes.'
              : 'Enter your email and password to access your notes.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: 'var(--canvas-soft)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-sm)',
              padding: '10px 14px',
              color: 'var(--ink)',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} color="var(--accent)" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {authModalMode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahtisham Tahir"
                className="text-input"
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="text-input"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="text-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '12px'
            }}
          >
            {loading ? 'Processing...' : authModalMode === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {/* Mode Switcher */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          {authModalMode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthModalMode('login'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Log in
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthModalMode('signup'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sign up
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
