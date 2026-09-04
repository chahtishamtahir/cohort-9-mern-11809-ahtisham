import React from 'react';
import { Tag, Pin, CheckCircle2 } from 'lucide-react';

export const OrganizeSpotlight = () => {
  return (
    <section className="spotlight-section">
      <div className="container">
        <div className="spotlight-grid reversed">
          {/* Right Column */}
          <div>
            <div className="badge-pill" style={{ marginBottom: '16px' }}>
              <Tag size={13} />
              <span>Flexible Organization</span>
            </div>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
              Keep your thoughts organized.
            </h2>
            <p className="lead-text" style={{ marginBottom: '28px' }}>
              Group your notes by work, personal goals, travel plans, or creative projects. Pin your top priorities to the very top so they're always right where you need them.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Category tags for every part of your life.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Pin high-priority to-dos and daily reminders.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Filter your workspace by any category with one click.</span>
              </div>
            </div>
          </div>

          {/* Left Column Visual Board */}
          <div className="card-soft" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hairline-soft)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)' }}>
                Category Tags & Pinboard
              </span>
              <span className="badge-pill" style={{ fontSize: '0.74rem', background: 'var(--canvas)' }}>
                📌 2 Pinned
              </span>
            </div>

            {/* Tag Cloud */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge-pill" style={{ background: 'var(--canvas)', padding: '6px 14px', fontSize: '0.82rem' }}>
                🎯 #Daily Focus (3)
              </span>
              <span className="badge-pill" style={{ background: 'var(--canvas)', padding: '6px 14px', fontSize: '0.82rem' }}>
                💡 #Project Ideas (4)
              </span>
              <span className="badge-pill" style={{ background: 'var(--canvas)', padding: '6px 14px', fontSize: '0.82rem' }}>
                ✈️ #Travel (2)
              </span>
              <span className="badge-pill" style={{ background: 'var(--canvas)', padding: '6px 14px', fontSize: '0.82rem' }}>
                📚 #Reading Notes (5)
              </span>
              <span className="badge-pill" style={{ background: 'var(--canvas)', padding: '6px 14px', fontSize: '0.82rem' }}>
                🍳 #Recipes (3)
              </span>
            </div>

            {/* Pinned Note Preview */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                padding: '16px 20px',
                borderRadius: 'var(--rounded-sm)',
                border: '1px solid var(--hairline-soft)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📌 Daily Non-Negotiable Habits</span>
                <Pin size={14} color="var(--text-faint)" />
              </div>
              <p className="body-text" style={{ fontSize: '0.88rem' }}>
                Hydrate, 20m movement, 30m deep focused reading, evening gratitude reflection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
