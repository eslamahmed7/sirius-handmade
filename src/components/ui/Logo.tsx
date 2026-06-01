import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-10 h-10 md:w-16 md:h-16',
    lg: 'w-24 h-24 sm:w-32 sm:h-32',
  };

  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`${sizeClasses[size]} ${className} drop-shadow-md shrink-0 transition-all duration-300 hover:scale-105`} 
      aria-label="Sirius Logo"
    >
      <circle cx="100" cy="100" r="96" fill="#613E72" />
      {/* Stars / Sparkles */}
      <path d="M 22,95 Q 40,95 40,60 Q 40,95 58,95 Q 40,95 40,120 Q 40,95 22,95 Z" fill="#FFDE43" />
      <path d="M 60,60 Q 70,60 70,50 Q 70,60 80,60 Q 70,60 70,70 Q 70,60 60,60 Z" fill="#FFDE43" />
      <path d="M 8,95 Q 15,95 15,88 Q 15,95 22,95 Q 15,95 15,102 Q 15,95 8,95 Z" fill="#FFDE43" />
      {/* Text */}
      <text x="120" y="112" fill="#F78FB3" fontFamily="'Tajawal', 'Inter', sans-serif" fontWeight="900" fontSize="46" textAnchor="middle" letterSpacing="0.5">SIRIUS</text>
      <text x="100" y="152" fill="#FFFFFF" fontFamily="'Tajawal', 'Inter', sans-serif" fontSize="9" fontStyle="italic" textAnchor="middle" opacity="0.9">Made with love by mariam abdelbaky</text>
    </svg>
  );
}
