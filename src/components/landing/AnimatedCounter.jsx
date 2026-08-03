import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

export default function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  // Extract integer value from string or number
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing out cubic function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * numericValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(numericValue);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, numericValue, duration]);

  return (
    <span ref={ref} className="font-mono">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
