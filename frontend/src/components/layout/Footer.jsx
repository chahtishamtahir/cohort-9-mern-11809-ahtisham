import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer-inverse">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Brand Lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="app-icon-squircle"
            style={{
              width: '34px',
              height: '34px',
              fontSize: '1rem',
              fontWeight: 800,
              backgroundColor: '#ffffff',
              color: '#111318',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
              border: '1.5px solid rgba(255, 255, 255, 0.35)'
            }}
          >
            N
          </div>
          <span style={{ fontWeight: 750, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
            NotionFlow
          </span>
        </div>

        {/* Clean Copyright */}
        <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.88rem' }}>
          © {new Date().getFullYear()} NotionFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
