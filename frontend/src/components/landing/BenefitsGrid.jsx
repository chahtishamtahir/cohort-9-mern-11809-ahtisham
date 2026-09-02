import React from 'react';
import { Zap, Lock, Download, Smartphone, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: <Zap size={18} />,
    title: "Instant & Lightweight.",
    description: "Opens and saves notes in milliseconds with zero lag or bloat."
  },
  {
    icon: <Lock size={18} />,
    title: "Private by Design.",
    description: "Your notes belong strictly to your account with secure token authentication."
  },
  {
    icon: <Download size={18} />,
    title: "One-Click Backup.",
    description: "Download your entire note archive to your computer as clean JSON anytime."
  },
  {
    icon: <Smartphone size={18} />,
    title: "Access Everywhere.",
    description: "Works seamlessly across your phone, tablet, laptop, and desktop browsers."
  }
];

export const BenefitsGrid = () => {
  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid var(--hairline-soft)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div className="badge-pill" style={{ marginBottom: '14px' }}>
            <Sparkles size={13} />
            <span>Why NotionFlow</span>
          </div>
          <h2 className="section-title" style={{ marginBottom: '12px' }}>
            Built for clarity, speed, and privacy.
          </h2>
          <p className="lead-text" style={{ maxWidth: '540px', margin: '0 auto' }}>
            A thoughtfully engineered note-taking experience with everything you need and zero clutter.
          </p>
        </div>

        {/* 4-Card Gallery Grid */}
        <div className="grid-4">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="card-canvas"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '24px'
              }}
            >
              <div className="app-icon-squircle" style={{ width: '36px', height: '36px' }}>
                {b.icon}
              </div>

              <h3 className="card-title" style={{ fontSize: '1.02rem', marginTop: '2px' }}>
                {b.title}
              </h3>

              <p className="body-text" style={{ fontSize: '0.88rem', lineHeight: '1.55' }}>
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
