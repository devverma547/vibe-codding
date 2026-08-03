import React from 'react';

/**
 * Badge component for status indicators.
 */
export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...rest
}) => {
  const baseClasses = 'inline-flex items-center gap-1.5 font-medium rounded-full';
  
  const variantClasses = {
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    info: 'bg-info/10 text-info border border-info/20',
    neutral: 'bg-surface text-text-secondary border border-border',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.neutral} ${sizeClasses[size] || sizeClasses.md} ${className}`;
  
  const dotColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-text-tertiary',
  };

  return (
    <span className={classes} {...rest}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.neutral}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
