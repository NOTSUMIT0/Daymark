import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2200 }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / (duration - 400)) * 100));
      setProgress(pct);

      if (elapsed >= duration - 400) {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className={`splash-screen-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-card">
        {/* Simple & Clean Daymark Icon Emblem */}
        <div className="splash-icon-wrapper">
          <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="16" fill="var(--paper)" stroke="var(--line)" strokeWidth="1.5" />
            <circle cx="32" cy="32" r="20" stroke="var(--accent)" strokeWidth="2" strokeOpacity="0.25" />
            <circle cx="32" cy="32" r="14" fill="var(--canvas)" stroke="var(--accent)" strokeWidth="2.2" />
            <path d="M32 23V27M32 37V41M23 32H27M37 32H41" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="32" cy="32" r="4" fill="var(--accent)" />
          </svg>
        </div>

        {/* Title & Tagline */}
        <h1 className="splash-title">Daymark</h1>
        <p className="splash-subtitle">Daily work, clearly kept.</p>

        {/* Loading Progress Bar */}
        <div className="splash-progress-track">
          <div className="splash-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <small className="splash-boot-text">
          {progress < 40 ? 'Loading workspace...' : progress < 85 ? 'Syncing daily records...' : 'Ready'}
        </small>
      </div>
    </div>
  );
};
