import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Button component with variants, sizes, and animations.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) => {
  const baseClasses = 'btn flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5A0] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';
  const variantClasses = {
    primary: 'btn-primary bg-primary text-slate-950 font-bold hover:bg-primary-hover shadow-sm',
    secondary: 'btn-secondary bg-secondary text-text hover:bg-surface',
    ghost: 'btn-ghost bg-transparent hover:bg-surface',
    danger: 'btn-danger bg-danger text-white hover:opacity-90',
    outline: 'btn-outline border border-border bg-transparent hover:bg-surface',
  };
  const sizeClasses = {
    sm: 'btn-sm px-3 py-1.5 text-sm',
    md: 'btn-md px-4 py-2 text-base',
    lg: 'btn-lg px-6 py-3 text-lg',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      {...rest}
    >
      {loading && <Loader2 className="animate-spin w-4 h-4" aria-hidden="true" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" aria-hidden="true" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" aria-hidden="true" />}
    </motion.button>
  );
};

export default Button;
