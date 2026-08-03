import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Briefcase, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../config/supabase';

export default function OnboardingModal({ isOpen, onClose, onSuccess }) {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    source: ''
  });

  // Pre-fill name if available from Google
  useEffect(() => {
    if (user?.user_metadata?.name || user?.user_metadata?.full_name) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata.name || user.user_metadata.full_name || ''
      }));
    }
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save data to the dedicated 'profiles' table
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          name: formData.name,
          position: formData.position,
          source: formData.source
        }]);
      
      if (error) {
        addToast(error.message, 'error');
      } else {
        addToast('Profile updated successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
        // Force refresh dashboard if needed by reloading window 
        // to immediately dismiss popup since useEffect has no dependency on onboarding state.
        window.location.reload();
      }
    } catch (error) {
      addToast(error.message || 'Something went wrong.', 'error');
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
            {/* Title & Subtitle */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to SiteProof!
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Please tell us a bit more about yourself to personalize your experience.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00F5A0]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Position Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">Your Position</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00F5A0]/50 transition-colors appearance-none"
                    style={{ backgroundColor: '#131823' }}
                  >
                    <option value="" disabled>Select your role</option>
                    <option value="founder">Founder / CEO</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="student">Student</option>
                    <option value="enterprise">Enterprise / Corporate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Source Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">How did you hear about us?</label>
                <div className="relative">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#00F5A0]/50 transition-colors appearance-none"
                    style={{ backgroundColor: '#131823' }}
                  >
                    <option value="" disabled>Select an option</option>
                    <option value="youtube">YouTube</option>
                    <option value="x">X (Twitter)</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="friends">Friends / Colleague</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 rounded-xl bg-[#00F5A0] hover:bg-[#00E093] text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,245,160,0.3)] hover:shadow-[0_0_30px_rgba(0,245,160,0.5)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin text-slate-950" size={20} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Complete Setup</span>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
