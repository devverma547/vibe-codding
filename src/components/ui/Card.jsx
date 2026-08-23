import React from 'react';
import { motion } from 'framer-motion';

/**
 * Glassmorphism card component with slots and variants.
 */
export const Card = ({
  children,
  hover = false,
  glass = false,
  gradient = false,
  padding = 'md',
  className = '',
  onClick,
  ...rest
}) => {
  const baseClasses = 'card rounded-xl border border-border overflow-hidden relative';
  
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover ? 'card-hover hover:shadow-lg transition-shadow cursor-pointer' : '';
  const glassClasses = glass ? 'card-glass bg-surface/60 backdrop-blur-md' : 'bg-surface';
  const gradientClasses = gradient ? 'card-gradient bg-gradient-to-br from-surface to-bg-secondary' : '';
  
  const classes = `${baseClasses} ${hoverClasses} ${glassClasses} ${gradientClasses} ${paddingClasses[padding] || paddingClasses.md} ${className}`;

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <motion.div
      className={classes}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Card;
