import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useToast } from '../../contexts/ToastContext';
import { isValidPassword } from '../../utils/validators';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidPassword(password)) {
      addToast('Password must be at least 8 characters with 1 uppercase, 1 lowercase & 1 number', 'error');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(password);
      if (res?.success) {
        setIsSuccess(true);
        addToast('Password updated successfully!', 'success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        addToast(res?.error || 'Failed to reset password', 'error');
      }
    } catch (error) {
      addToast(error?.message || 'Password reset failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden auth-page">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
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
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            SiteProof
          </span>
        </Link>

        <Card className="p-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl">
          {isSuccess ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-[#00F5A0] mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset Complete</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been updated. Redirecting you to the dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
                <p className="text-muted-foreground mt-2">Enter your new account password below</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground/80">New Password</label>
                  <Input
                    type="password"
                    placeholder="At least 8 chars (A-z, 0-9)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={Lock}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground/80">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={Lock}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-2 font-semibold bg-[#00F5A0] text-slate-950 hover:bg-[#00E093]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Password'}
                </Button>
              </form>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
