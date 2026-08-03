import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import { initialUrlParams } from '../../config/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      addToast('Successfully authenticated!', 'success');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Check for errors in URL (using initial params captured before Supabase client clears them)
    const hash = window.location.hash || initialUrlParams.hash;
    const search = window.location.search || initialUrlParams.search;
    
    if (hash.includes('error=') || search.includes('error=')) {
      // Create a clean URLSearchParams string by stripping the # or ? and relying on search if hash is empty
      const paramString = hash.includes('error=') ? hash.replace('#', '?') : search;
      const params = new URLSearchParams(paramString);
      const errorDesc = params.get('error_description') || 'Authentication failed. Please try again.';
      addToast(errorDesc.replace(/\+/g, ' '), 'error');
      navigate('/login', { replace: true });
      return;
    }

    // Safety timeout in case authentication fails or hangs
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        addToast('Authentication took too long or failed. Please try logging in again.', 'error');
        navigate('/login', { replace: true });
      }
    }, 4000); // Reduced to 4s for better UX

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate, addToast]);

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-gray-100 p-4">
      <Loader2 className="w-12 h-12 text-[#00F5A0] animate-spin mb-4" />
      <h2 className="text-xl font-semibold mb-2">Completing Authentication</h2>
      <p className="text-gray-400 text-sm">Please wait while we finalize your sign-in...</p>
    </div>
  );
}
