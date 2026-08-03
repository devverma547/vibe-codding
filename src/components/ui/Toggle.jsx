import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

/**
 * Theme toggle switch component.
 */
export const Toggle = ({
  checked = false,
  onChange,
  className = '',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-label="Toggle theme light or dark"
      aria-checked={checked}
      onClick={() => onChange && onChange(!checked)}
      className={`relative inline-flex items-center h-[30px] w-[60px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors focus:outline-none ${
        checked ? 'bg-[#0F1726]' : 'bg-slate-200 border-slate-300'
      } ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      <span className="absolute left-1.5 flex items-center justify-center w-5 h-5 text-gray-400">
        <Moon className="w-3.5 h-3.5" />
      </span>
      <span className="absolute right-1.5 flex items-center justify-center w-5 h-5 text-amber-500">
        <Sun className="w-3.5 h-3.5" />
      </span>
      <motion.span
        layout
        className={`z-10 inline-block w-5 h-5 rounded-full shadow-md pointer-events-none ${
          checked ? 'bg-[#00F5A0]' : 'bg-white'
        }`}
        animate={{
          x: checked ? 32 : 4
        }}
        transition={{ type: "spring", stiffness: 600, damping: 25 }}
      />
    </button>
  );
};

export default Toggle;
