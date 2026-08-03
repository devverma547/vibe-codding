import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { googleSignIn } = useAuth();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await googleSignIn();
      if (res && res.error) {
        setError(res.error || 'Failed to sign in with Google.');
      } else if (res && res.success) {
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-[#080C14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10"
        >
          {/* Header Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#00F5A0] to-emerald-500" />

          <div className="p-8">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.2)]">
                <ShieldCheck size={24} className="text-[#00F5A0]" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1">
                SiteProof
              </span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Get Started with SiteProof
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              Sign in to start auditing your websites
            </p>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,245,160,0.3)] hover:shadow-[0_0_30px_rgba(0,245,160,0.5)] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-slate-950" size={20} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
