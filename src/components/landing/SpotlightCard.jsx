import React, { useRef, useState } from 'react';

export default function SpotlightCard({ children, className = '', spotlightColor = 'rgba(0, 245, 160, 0.15)' }) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-white/10 p-6 transition-all duration-300 ${className}`}
    >
      {/* Radial Spotlight Overlay */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      
      {/* Border Highlight Effect */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 border border-[#00F5A0]/40"
        style={{
          opacity,
          maskImage: `radial-gradient(250px circle at ${position.x}px ${position.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(250px circle at ${position.x}px ${position.y}px, black, transparent)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
