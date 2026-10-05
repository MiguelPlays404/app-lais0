import React from 'react';

interface TikTokCoinProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const TikTokCoin: React.FC<TikTokCoinProps> = ({ 
  className = '', 
  size = 24,
  animated = false 
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${animated ? 'hover:scale-110 transition-transform duration-300' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="coinGradOuter" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="35%" stopColor="#FFC83B" />
            <stop offset="70%" stopColor="#FA9D16" />
            <stop offset="100%" stopColor="#C96B00" />
          </radialGradient>
          <linearGradient id="coinGradInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD84D" />
            <stop offset="50%" stopColor="#FFB319" />
            <stop offset="100%" stopColor="#E07900" />
          </linearGradient>
          <linearGradient id="coinRim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF5BA" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8C4600" stopOpacity="0.4" />
          </linearGradient>
          <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#B86200" floodOpacity="0.6"/>
          </filter>
        </defs>

        {/* Outer Coin Body */}
        <circle cx="50" cy="50" r="48" fill="url(#coinGradOuter)" />
        <circle cx="50" cy="50" r="48" stroke="url(#coinRim)" strokeWidth="3" />

        {/* Inner Depressed Circle */}
        <circle cx="50" cy="50" r="39" fill="url(#coinGradInner)" filter="url(#coinShadow)" />
        <circle cx="50" cy="50" r="39" stroke="#E38000" strokeWidth="1.5" strokeOpacity="0.6" />

        {/* Embossed TikTok Music Note */}
        <g transform="translate(32, 23) scale(0.38)">
          <path
            d="M52 22C54 30 60 36 68 38V49C62 49 57 47 52 44V68C52 80 42 89 30 89C18 89 8 80 8 68C8 56 18 47 30 47C33 47 36 48 38 49V61C36 60 33 59 30 59C25 59 21 63 21 68C21 73 25 77 30 77C35 77 39 73 39 68V22H52Z"
            fill="#804100"
            opacity="0.3"
            transform="translate(1.5, 2)"
          />
          <path
            d="M52 22C54 30 60 36 68 38V49C62 49 57 47 52 44V68C52 80 42 89 30 89C18 89 8 80 8 68C8 56 18 47 30 47C33 47 36 48 38 49V61C36 60 33 59 30 59C25 59 21 63 21 68C21 73 25 77 30 77C35 77 39 73 39 68V22H52Z"
            fill="#FFF"
            opacity="0.9"
          />
        </g>

        {/* Specular Highlight */}
        <ellipse cx="38" cy="24" rx="14" ry="6" fill="#FFFFFF" opacity="0.4" transform="rotate(-30 38 24)" />
      </svg>
    </div>
  );
};
