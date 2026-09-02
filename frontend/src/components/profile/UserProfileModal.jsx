import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, LogOut, Calendar, CheckCircle2 } from 'lucide-react';

export const UserProfileModal = () => {
  const { user, profileModalOpen, closeProfileModal, logout } = useAuth();

  if (!profileModalOpen || !user) return null;

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="modal-overlay" onClick={closeProfileModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
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
        >
          <X size={18} />
        </button>

        {/* Profile Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: '0 auto 12px'
            }}
          >
            {userInitial}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user.name}</h2>
          <span className="small-text">{user.email}</span>
        </div>

        {/* User Stats Grid */}
        <div
          className="card-soft"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>
              {user.noteCount || 4}
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Notes
            </span>
          </div>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>
              Free
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Workspace Plan
            </span>
          </div>
        </div>

        {/* Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={15} /> Member Since
            </span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{user.joinedDate || 'September 2026'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={15} /> Account Status
            </span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Active</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            closeProfileModal();
            logout();
          }}
          className="btn btn-outline"
          style={{
            width: '100%',
            color: 'var(--ink)'
          }}
        >
          <LogOut size={16} /> Log Out of Workspace
        </button>
      </div>
    </div>
  );
};
