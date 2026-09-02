import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';

export const HeroSection = () => {
  const { openAuthModal } = useAuth();

  return (
    <section style={{ padding: '96px 0 72px', textAlign: 'center' }}>
      <div className="container">
        {/* Top Tag Pill */}
        <div style={{ display: 'inline-flex', marginBottom: '24px' }}>
          <div className="badge-pill">
            <Sparkles size={13} />
            <span>Fast, distraction-free note taking.</span>
          </div>
        </div>

        {/* Display Heading */}
        <h1 className="display-title" style={{ maxWidth: '820px', margin: '0 auto 24px' }}>
          Notes engineered for pure focus.
        </h1>

        {/* Subtitle */}
        <p className="lead-text" style={{ maxWidth: '600px', margin: '0 auto 40px' }}>
          A minimal, distraction-free workspace to capture daily thoughts, organize with tags, and find anything in seconds.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => openAuthModal('signup')}
            className="btn btn-primary btn-lg"
          >
            Get started for free <ArrowRight size={16} />
          </button>
          <button
            onClick={() => openAuthModal('login')}
            className="btn btn-outline btn-lg"
          >
            Log in
          </button>
        </div>
      </div>
    </section>
  );
};
