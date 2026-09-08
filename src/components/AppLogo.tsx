import React from 'react';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'hero';
  showText?: boolean;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'medium',
  showText = true,
  className = ''
}) => {
  const dimensions = {
    small: { icon: 24, text: '1.2rem', gap: 8 },
    medium: { icon: 32, text: '1.5rem', gap: 10 },
    hero: { icon: 48, text: '2.2rem', gap: 14 }
  }[size];

  return (
    <div
      className={`app-logo-brand ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${dimensions.gap}px`,
        userSelect: 'none'
      }}
    >
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Dark / Ink outer container ring */}
        <rect width="48" height="48" rx="12" fill="currentColor" fillOpacity="0.08" />
        <rect x="1" y="1" width="46" height="46" rx="11" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" />

        {/* Terracotta outer compass circle */}
        <circle cx="24" cy="24" r="15" stroke="#dc8064" strokeWidth="2.5" strokeDasharray="3 3" />

        {/* Center Editorial Focus Diamond Mark */}
        <path
          d="M24 12L28.5 24L24 36L19.5 24L24 12Z"
          fill="#dc8064"
        />

        {/* Inner Ink Core Dot */}
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
      </svg>

      {showText && (
        <span
          className="brand-title-text"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: dimensions.text,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--color-text, currentColor)',
            lineHeight: 1
          }}
        >
          Daymark
        </span>
      )}
    </div>
  );
};
