import React from 'react';
import { Edit3, CheckCircle2 } from 'lucide-react';

export const CaptureSpotlight = () => {
  return (
    <section className="spotlight-section">
      <div className="container">
        <div className="spotlight-grid">
          {/* Left Column */}
          <div>
            <div className="badge-pill" style={{ marginBottom: '16px' }}>
              <Edit3 size={13} />
              <span>Frictionless Capture</span>
            </div>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
              Write as fast as your mind moves.
            </h2>
            <p className="lead-text" style={{ marginBottom: '28px' }}>
              A calm, minimal space to capture meeting takeaways, daily reflections, to-do lists, and brainstorms with zero distraction.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Format with headings, bullet lists, and checklists.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Automatic saving so your thoughts are never lost.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Instant loading and sync across all your devices.</span>
              </div>
            </div>
          </div>

          {/* Right Column Visual Card */}
          <div className="card-soft">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--hairline-soft)', marginBottom: '18px' }}>
              <span className="badge-pill" style={{ background: 'var(--canvas)' }}>
                #Reflections
              </span>
              <span className="small-text">Auto-saved 1m ago</span>
            </div>

            <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '12px' }}>
              Weekly Mindset & Project Notes
            </h3>

            <p className="body-text" style={{ marginBottom: '16px' }}>
              Focusing on consistent progress rather than perfection this week:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px', fontSize: '0.9rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ink)' }}>
                <CheckCircle2 size={16} />
                <span>Outline core application structure and pages</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ink)' }}>
                <CheckCircle2 size={16} />
                <span>Organize reading notes and daily habit tracker</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--hairline)', display: 'inline-block' }} />
                <span>Schedule team alignment catch-up for Friday</span>
              </label>
            </div>

            <div
              style={{
                backgroundColor: 'var(--canvas)',
                padding: '12px 16px',
                borderRadius: 'var(--rounded-xs)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                borderLeft: '2px solid var(--ink)'
              }}
            >
              💡 <em>"Simplicity is the prerequisite for reliability."</em>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
