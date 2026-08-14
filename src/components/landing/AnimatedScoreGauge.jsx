import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedScoreGauge({ targetScore = 87, duration = 2.5 }) {
  const [currentScore, setCurrentScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!isVisible) return;

    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrentScore(Math.round(eased * targetScore));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, targetScore, duration]);

  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 80) return '#00F5A0';
    if (score >= 60) return '#F5A623';
    return '#FF4757';
  };

  const scoreColor = getScoreColor(currentScore);

  return (
    <motion.div
      className="relative inline-flex items-center justify-center p-2"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => setIsVisible(true)}
      transition={{ duration: 0.6 }}
    >
      {/* Outer glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl pointer-events-none"
        style={{
          width: size + 20,
          height: size + 20,
          background: `radial-gradient(circle, ${scoreColor}25 0%, transparent 70%)`,
        }}
      />
      
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.1s ease-out',
            filter: `drop-shadow(0 0 8px ${scoreColor}80)`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-4xl font-extrabold font-mono"
          style={{ color: scoreColor }}
        >
          {currentScore}
        </span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">out of 100</span>
      </div>
    </motion.div>
  );
}
