import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, googleSignIn, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (res?.success) {
        addToast('Welcome back!', 'success');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        addToast(res?.error || 'Invalid email or password', 'error');
      }
    } catch (error) {
      addToast(error.message || 'Login failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await googleSignIn();
      if (res?.success) {
        addToast('Redirecting to Google authentication...', 'info');
      } else {
        addToast(res?.error || 'Failed to initialize Google login', 'error');
      }
    } catch (error) {
      addToast(error?.message || 'Google login failed', 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden auth-page">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#00F5A0]/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/70">
            SiteProof
          </span>
        </Link>

        <Card className="p-8 border-slate-200 dark:border-white/10 shadow-2xl bg-white/80 dark:bg-[#0D1527]/80 backdrop-blur-xl auth-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">Sign in to access your website audits</p>
          </div>

          {/* Google Sign In */}
          <button 
            type="button" 
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white font-semibold rounded-xl border border-slate-200 dark:border-white/10 transition-all duration-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.549L20.0303 3.125C17.9503 1.19 15.2353 0 12.0003 0C7.31028 0 3.25528 2.69 1.28027 6.609L5.27027 9.704C6.21527 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
              <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.87037 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.31037 24.0001 12.0004 24.0001Z" fill="#34A853"/>
            </svg>
            <span>{isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              id="login-email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
              required
            />

            <div>
              <Input
                id="login-password"
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={Lock}
                required
              />
              <div className="flex justify-end mt-1.5">
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-slate-500 hover:text-[#00F5A0] dark:text-gray-400 dark:hover:text-[#00F5A0] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#00F5A0] text-slate-950 font-bold hover:bg-[#00E093] shadow-[0_0_20px_rgba(0,245,160,0.2)] hover:shadow-[0_0_30px_rgba(0,245,160,0.4)] transition-all cursor-pointer"
              loading={isLoading}
              disabled={isLoading || isGoogleLoading}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#00F5A0] hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
