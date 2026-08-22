import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Word = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <span className="relative inline-block mr-2 sm:mr-3 mt-[0.1em]">
      <span className="absolute opacity-15 select-none">{children}</span>
      <motion.span style={{ opacity }} className="text-slate-900 dark:text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
        {children}
      </motion.span>
    </span>
  );
};

export default function KineticTypography({ text, className = '' }) {
  const container = useRef(null);
  
  // Track the scroll progress of this specific component
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start 85%', 'end 50%'], // Starts when top of element hits 85% of viewport, ends at 50%
  });

  const words = text.split(' ');

  return (
    <div ref={container} className={`flex flex-wrap items-center leading-[1.15] ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + (1 / words.length);
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </div>
  );
}
