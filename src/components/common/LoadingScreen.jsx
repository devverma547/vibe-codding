import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';

/**
 * Full page loading screen component.
 */
export const LoadingScreen = ({
  message = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute z-10 text-primary"
          >
            <Shield className="w-16 h-16" />
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            className="text-primary/30"
          >
            <Loader2 className="w-24 h-24" />
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-medium text-text animate-pulse"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
