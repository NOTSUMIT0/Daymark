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
        {/* Official Daymark Icon Emblem */}
        <div className="splash-icon-wrapper">
          <svg width="84" height="84" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" rx="128" fill="#24221e"/>
            <rect x="16" y="16" width="480" height="480" rx="112" stroke="#dc8064" strokeOpacity="0.35" strokeWidth="12"/>
            <circle cx="256" cy="256" r="160" stroke="#dc8064" strokeWidth="14" strokeOpacity="0.25"/>
            <circle cx="256" cy="256" r="112" fill="#181714" stroke="#dc8064" strokeWidth="16"/>
            <path d="M256 168V200M256 312V344M168 256H200M312 256H344" stroke="#dc8064" strokeWidth="16" strokeLinecap="round"/>
            <circle cx="256" cy="256" r="32" fill="#dc8064"/>
            <circle cx="256" cy="256" r="14" fill="#ffffff"/>
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
