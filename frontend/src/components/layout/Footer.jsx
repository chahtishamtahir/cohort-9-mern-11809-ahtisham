import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer-inverse">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Brand Lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/favicon.svg?v=2"
            alt="NotionFlow Logo"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '13px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 5px rgba(0, 0, 0, 0.08)',
              flexShrink: 0,
              display: 'block'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', color: 'var(--on-primary)', lineHeight: 1.2 }}>
              NotionFlow
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)', fontWeight: 500 }}>
              Ideas in Flow
            </span>
          </div>
        </div>

        {/* Clean Copyright */}
        <div style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>
          © {new Date().getFullYear()} NotionFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
