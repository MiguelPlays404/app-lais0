import React from 'react';

interface TikTokLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const TikTokLogo: React.FC<TikTokLogoProps> = ({ className = '', size = 32, showText = true }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 font-bold select-none ${className}`}>
      {/* TikTok Chromatic Aberration Musical Note Icon */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cyan Glow Layer */}
          <path
            d="M52 22C54 30 60 36 68 38V49C62 49 57 47 52 44V68C52 80 42 89 30 89C18 89 8 80 8 68C8 56 18 47 30 47C33 47 36 48 38 49V61C36 60 33 59 30 59C25 59 21 63 21 68C21 73 25 77 30 77C35 77 39 73 39 68V22H52Z"
            fill="#25F4EE"
            transform="translate(-2, -2)"
          />
          {/* Magenta / Pink Glow Layer */}
          <path
            d="M52 22C54 30 60 36 68 38V49C62 49 57 47 52 44V68C52 80 42 89 30 89C18 89 8 80 8 68C8 56 18 47 30 47C33 47 36 48 38 49V61C36 60 33 59 30 59C25 59 21 63 21 68C21 73 25 77 30 77C35 77 39 73 39 68V22H52Z"
            fill="#FE2C55"
            transform="translate(2, 2)"
          />
          {/* Main White Layer */}
          <path
            d="M52 22C54 30 60 36 68 38V49C62 49 57 47 52 44V68C52 80 42 89 30 89C18 89 8 80 8 68C8 56 18 47 30 47C33 47 36 48 38 49V61C36 60 33 59 30 59C25 59 21 63 21 68C21 73 25 77 30 77C35 77 39 73 39 68V22H52Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {showText && (
        <span className="text-xl tracking-tight font-black font-sans text-white flex items-center">
          TikTok
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gradient-to-r from-[#FE2C55] to-[#FF004F] text-white tracking-widest shadow-sm">
            Coins
          </span>
        </span>
      )}
    </div>
  );
};
