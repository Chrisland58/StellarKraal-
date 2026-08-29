import React from "react";

interface HeroProps {
  children: React.ReactNode;
  className?: string;
}

export function Hero({ children, className = "" }: HeroProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none dot-grid"
        aria-hidden="true"
      ></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
