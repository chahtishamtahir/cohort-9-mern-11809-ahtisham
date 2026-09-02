import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer-inverse">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Brand Lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="app-icon-squircle"
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: 'var(--on-primary)',
              color: 'var(--primary)',
              fontSize: '0.85rem'
            }}
          >
            N
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--on-primary)' }}>
            NotionFlow
          </span>
        </div>

        {/* Clean Copyright */}
        <div style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} NotionFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
