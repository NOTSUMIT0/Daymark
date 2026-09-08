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
        {/* Animated Terracotta & Ink Emblem */}
        <div className="splash-logo-ring">
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="#24221e" />
            <rect x="1" y="1" width="46" height="46" rx="13" stroke="#dc8064" strokeOpacity="0.4" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="16" stroke="#dc8064" strokeWidth="2.5" strokeDasharray="4 4" className="spinning-ring" />
            <path d="M24 10L29.5 24L24 38L18.5 24L24 10Z" fill="#dc8064" className="diamond-pulse" />
            <circle cx="24" cy="24" r="3" fill="#181714" />
            <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
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
          {progress < 40 ? 'Initializing IndexedDB Database Engine...' : progress < 80 ? 'Loading Workspaces & Task Graphs...' : 'Readying Offline Environment...'}
        </small>
      </div>
    </div>
  );
};
