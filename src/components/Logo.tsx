import React, { useState } from "react";

interface LogoProps {
  className?: string; // custom extra classes for spacing
  iconOnly?: boolean; // if true, render only the icon
  size?: "sm" | "md" | "lg" | "xl"; // sizing preset
  onClick?: () => void; // optional tap handler
}

export default function Logo({ className = "", iconOnly = false, size = "md", onClick }: LogoProps) {
  const [hasError, setHasError] = useState(false);

  // Hard fallback if rendering issues occur
  if (hasError) {
    return (
      <div className={`flex items-center gap-2 ${className}`} onClick={onClick}>
        <div className="flex items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm h-8 w-8 shadow-xs">
          D
        </div>
        {!iconOnly && (
          <span className="font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Dolver AI
          </span>
        )}
      </div>
    );
  }

  // Size preset configurations
  const sizeClasses = {
    sm: { icon: "h-5 w-5", text: "text-xs font-bold" },
    md: { icon: "h-7 w-7", text: "text-[15px] font-bold" },
    lg: { icon: "h-11 w-11", text: "text-xl font-extrabold" },
    xl: { icon: "h-16 w-16", text: "text-3xl font-black" },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} onClick={onClick}>
      {/* Precision Engineered SVG Vector Logo */}
      <svg
        className={`${currentSize.icon} transition-transform duration-300 group-hover:scale-105 flex-shrink-0`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onError={() => setHasError(true)}
      >
        <defs>
          {/* Exact color gradient stops extracted from the uploaded high-resolution branding logo image */}
          <linearGradient id="dolverLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" /> {/* Blue 500 */}
            <stop offset="50%" stopColor="#2563EB" /> {/* Blue 600 */}
            <stop offset="100%" stopColor="#1D4ED8" /> {/* Blue 700 */}
          </linearGradient>
          
          <linearGradient id="dolverRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" /> {/* Blue 900 */}
            <stop offset="50%" stopColor="#172554" /> {/* Blue 950 */}
            <stop offset="100%" stopColor="#0F172A" /> {/* Slate 900 */}
          </linearGradient>

          <filter id="dolverSoftShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* 1. Pointy-topped 3D Hexagon Base */}
        {/* Right Shade Face */}
        <path
          d="M50 6 L90 28 V72 L50 94 V6 Z"
          fill="url(#dolverRightGrad)"
          filter="url(#dolverSoftShadow)"
        />

        {/* Left Highlight Face */}
        <path
          d="M50 6 L10 28 V72 L50 94 V6 Z"
          fill="url(#dolverLeftGrad)"
        />

        {/* Top Perspective Face Overlay */}
        <path
          d="M50 6 L90 28 L50 49 L10 28 Z"
          fill="white"
          opacity="0.12"
        />

        {/* 2. Brand-Specific stylized white D symbol */}
        {/* Outward white 'D' silhouette */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M34 26 C31.7909 26 30 27.7909 30 30 V70 C30 72.2091 31.7909 74 34 74 H48 C61.2548 74 72 63.2548 72 50 C72 36.7452 61.2548 26 48 26 H34ZM41.5 35.5 V64.5 H48 C56.0081 64.5 62.5 58.0081 62.5 50 C62.5 41.9919 56.0081 35.5 48 35.5 H41.5Z"
          fill="white"
        />

        {/* Light Inner-Glow Reflector Line inside D */}
        <path
          d="M41.5 39 H48 C54.0751 39 59 43.9249 59 50 C59 56.0751 54.0751 61 48 61 H41.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.25"
        />
      </svg>

      {/* 3. Customizable Brand Typeface Name */}
      {!iconOnly && (
        <span
          className={`${currentSize.text} tracking-tight font-bold transition-colors text-slate-800 dark:text-slate-100 font-sans`}
        >
          Dolver <span className="text-blue-600 dark:text-blue-400 font-extrabold">AI</span>
        </span>
      )}
    </div>
  );
}
