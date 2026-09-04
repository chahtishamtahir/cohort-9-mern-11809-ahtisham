import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { X, LogOut, Calendar, CheckCircle2, User, Lock, KeyRound, AlertCircle, Check } from 'lucide-react';

export const UserProfileModal = () => {
  const { user, profileModalOpen, closeProfileModal, logout, noteCount, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

  // Name edit state
  const [name, setName] = useState(user?.name || '');
  const [prevUser, setPrevUser] = useState(user);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Sync state when user changes
  if (user !== prevUser) {
    setPrevUser(user);
    setName(user?.name || '');
  }

  if (!profileModalOpen || !user) return null;

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  const memberSince = user.created_at && !isNaN(new Date(user.created_at).getTime())
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'Recent Member';

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name cannot be empty.');
      return;
    }

    if (trimmedName === user.name) {
      setNameError('Name is already set to this value.');
      return;
    }

    try {
      setSavingName(true);
      await updateProfile({ name: trimmedName });
      setNameSuccess('Name updated successfully!');
      setTimeout(() => setNameSuccess(''), 3000);
    } catch (err) {
      setNameError(err.message || 'Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await updateProfile({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '24px 28px' }}
      >
        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          className="btn btn-ghost btn-sm"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '6px',
            borderRadius: 'var(--rounded-full)'
          }}
          aria-label="Close profile modal"
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Account Settings
          </h2>
          <span className="small-text" style={{ color: 'var(--text-muted)' }}>
            Manage your personal profile and security preferences
          </span>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: 'var(--field)',
            padding: '4px',
            borderRadius: 'var(--rounded-full)',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setNameError('');
              setPasswordError('');
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--rounded-full)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.84rem',
              background: activeTab === 'profile' ? 'var(--canvas)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--ink)' : 'var(--text-muted)',
              boxShadow: activeTab === 'profile' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={14} />
            Profile Details
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setNameError('');
              setPasswordError('');
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--rounded-full)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.84rem',
              background: activeTab === 'security' ? 'var(--canvas)' : 'transparent',
              color: activeTab === 'security' ? 'var(--ink)' : 'var(--text-muted)',
              boxShadow: activeTab === 'security' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Lock size={14} />
            Security & Password
          </button>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <div>
            {/* User Avatar + Email summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {userInitial}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>

            {/* Editable Name Form */}
            <form onSubmit={handleUpdateName} style={{ marginBottom: '18px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label
                  htmlFor="profile-name-input"
                  style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}
                >
                  Display Name
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="profile-name-input"
                    type="text"
                    className="text-input"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError('');
                      setNameSuccess('');
                    }}
                    placeholder="Enter your name"
                    style={{ flex: 1, padding: '9px 14px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingName || !name.trim() || name.trim() === user.name}
                    style={{
                      opacity: (savingName || !name.trim() || name.trim() === user.name) ? 0.6 : 1,
                      cursor: (savingName || !name.trim() || name.trim() === user.name) ? 'not-allowed' : 'pointer',
                      padding: '8px 16px'
                    }}
                  >
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {nameError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
                  <AlertCircle size={14} />
                  <span>{nameError}</span>
                </div>
              )}

              {nameSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>
                  <Check size={14} />
                  <span>{nameSuccess}</span>
                </div>
              )}
            </form>

            {/* User Stats Grid */}
            <div
              className="card-soft"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
                  {noteCount ?? user.noteCount ?? 0}
                </span>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Total Notes
                </span>
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Free
                </span>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Workspace Plan
                </span>
              </div>
            </div>

            {/* Details List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} /> Member Since
                </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{memberSince}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} /> Account Status
                </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security & Change Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePassword} style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <KeyRound size={18} style={{ color: 'var(--ink)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink)' }}>
                  Change Password
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Must be at least 6 characters long
                </div>
              </div>
            </div>

            {passwordError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  color: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  padding: '8px 12px',
                  borderRadius: 'var(--rounded-xs)',
                  marginBottom: '12px'
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  padding: '8px 12px',
                  borderRadius: 'var(--rounded-xs)',
                  marginBottom: '12px'
                }}
              >
                <Check size={15} style={{ flexShrink: 0 }} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label
                  htmlFor="current-password-input"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px', color: 'var(--ink)' }}
                >
                  Current Password
                </label>
                <input
                  id="current-password-input"
                  type="password"
                  className="text-input"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter current password"
                  style={{ padding: '9px 14px', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label
                  htmlFor="new-password-input"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px', color: 'var(--ink)' }}
                >
                  New Password
                </label>
                <input
                  id="new-password-input"
                  type="password"
                  className="text-input"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Minimum 6 characters"
                  style={{ padding: '9px 14px', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password-input"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px', color: 'var(--ink)' }}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password-input"
                  type="password"
                  className="text-input"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Re-enter new password"
                  style={{ padding: '9px 14px', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              style={{
                width: '100%',
                padding: '10px 16px',
                opacity: (savingPassword || !currentPassword || !newPassword || !confirmPassword) ? 0.6 : 1,
                cursor: (savingPassword || !currentPassword || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer'
              }}
            >
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

        {/* Divider & Logout Button */}
        <div style={{ borderTop: '1px solid var(--hairline-soft)', paddingTop: '16px', marginTop: '6px' }}>
          <button
            onClick={() => {
              closeProfileModal();
              logout();
            }}
            className="btn btn-outline"
            style={{
              width: '100%',
              color: 'var(--ink)',
              padding: '9px 16px',
              fontSize: '0.88rem'
            }}
          >
            <LogOut size={16} /> Log Out of Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
