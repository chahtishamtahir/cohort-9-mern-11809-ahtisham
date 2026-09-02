import React from 'react';
import { Search, CheckCircle2 } from 'lucide-react';

export const SearchSpotlight = () => {
  return (
    <section className="spotlight-section">
      <div className="container">
        <div className="spotlight-grid">
          {/* Left Column */}
          <div>
            <div className="badge-pill" style={{ marginBottom: '16px' }}>
              <Search size={13} />
              <span>Instant Deep Search</span>
            </div>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
              Find anything in a heartbeat.
            </h2>
            <p className="lead-text" style={{ marginBottom: '28px' }}>
              Never waste time hunting for an old idea or meeting takeaway. Instant full-text search filters your notes in real time as you type each letter.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Real-time search across titles, content, and tags.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Fast keyword filtering with zero delay.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.94rem' }}>
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>Clean, readable results highlighted immediately.</span>
              </div>
            </div>
          </div>

          {/* Right Column Visual Card */}
          <div className="card-soft" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Search Input Simulation */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-sm)',
                padding: '11px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.92rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search size={16} color="var(--ink)" />
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>"Summer trip"</span>
              </div>
              <span className="small-text">Found 2 notes</span>
            </div>

            {/* Filtered Result 1 */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                borderRadius: 'var(--rounded-sm)',
                padding: '14px 18px',
                border: '1px solid var(--hairline-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.94rem' }}>✈️ Lake District Summer Trip</span>
                <span className="badge-pill" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>#Travel</span>
              </div>
              <p className="body-text" style={{ fontSize: '0.86rem' }}>
                Confirm morning express train tickets and lakeside cabin reservation...
              </p>
            </div>

            {/* Filtered Result 2 */}
            <div
              style={{
                backgroundColor: 'var(--canvas)',
                borderRadius: 'var(--rounded-sm)',
                padding: '14px 18px',
                border: '1px solid var(--hairline-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.94rem' }}>🎒 Summer Travel Packing Essentials</span>
                <span className="badge-pill" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>#Travel</span>
              </div>
              <p className="body-text" style={{ fontSize: '0.86rem' }}>
                Passport, IDs, camera, charger, portable power bank, walking shoes...
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
