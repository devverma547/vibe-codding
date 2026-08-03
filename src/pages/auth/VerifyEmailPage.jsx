import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Shield, User } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

export default function VerifyEmailPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { verifyEmail } = useAuth();

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    // Keep only the last character if multiple are pasted/typed somehow
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace to focus previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    // Focus appropriate input after paste
    const focusIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    
    if (!email) {
      addToast('Please enter your email address', 'warning');
      return;
    }
    if (verificationCode.length !== 6) {
      addToast('Please enter the full 6-digit code', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyEmail({ email, token: verificationCode });
      if (res.success) {
        addToast('Email verified successfully!', 'success');
        navigate('/dashboard');
      } else {
        addToast(res.error || 'Verification failed. Please try again.', 'error');
      }
    } catch {
      addToast('Verification failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    addToast('If your account exists, a new code has been sent.', 'info');
    // Actual resend API could be called here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden auth-page">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            SecureScan AI
          </span>
        </div>

        <Card className="p-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl auth-card text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">Verify your email</h1>
          <p className="text-muted-foreground mb-8">
            We've sent a 6-digit code to your email. Enter it below to verify your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left">
              <label className="block text-sm font-medium mb-1 text-foreground/80">Email address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={User}
                required
              />
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 mt-4">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg border border-border bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <Button type="submit" className="w-full btn-primary" isLoading={isLoading}>
              Verify Email
            </Button>
          </form>

          <div className="mt-8 text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <button 
              onClick={handleResend}
              className="text-primary hover:underline font-medium focus:outline-none"
            >
              Resend
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
