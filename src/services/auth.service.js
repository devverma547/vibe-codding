import { supabase } from '../config/supabase';

export const authService = {
  signup: async ({ name, email, password }) => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const redirectUrl = new URL(`${baseUrl}dashboard`.replace('//', '/'), window.location.origin).href;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { 
        success: true, 
        data: data.user, 
        session: data.session,
        requiresConfirmation: !data.session 
      };
    } catch (err) {
      console.error('[Auth] Signup error:', err);
      return { success: false, error: err.message || 'Signup failed' };
    }
  },

  login: async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data.user, session: data.session };
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return { success: false, error: err.message || 'Login failed' };
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      console.error('[Auth] Logout error:', err);
      return { success: false, error: err.message || 'Logout failed' };
    }
  },

  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('[Auth] getCurrentUser AuthError:', error.message);
      }
      return data?.user || null;
    } catch (err) {
      console.error('[Auth] getCurrentUser error:', err);
      return null;
    }
  },

  forgotPassword: async (email) => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const redirectUrl = new URL(`${baseUrl}reset-password`.replace('//', '/'), window.location.origin).href;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      console.error('[Auth] Forgot password error:', err);
      return { success: false, error: err.message || 'Failed to send reset email' };
    }
  },

  resetPassword: async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data.user };
    } catch (err) {
      console.error('[Auth] Reset password error:', err);
      return { success: false, error: err.message || 'Failed to update password' };
    }
  },

  verifyEmail: async ({ email, token }) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err) {
      console.error('[Auth] Verify email error:', err);
      return { success: false, error: err.message || 'Verification failed' };
    }
  },

  googleSignIn: async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const redirectUrl = new URL(`${baseUrl}auth/callback`.replace('//', '/'), window.location.origin).href;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      console.error('[Auth] Google sign-in error:', err);
      return { success: false, error: err.message || 'Google sign-in failed' };
    }
  },

  updateProfile: async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data.user };
    } catch (err) {
      console.error('[Auth] Update profile error:', err);
      return { success: false, error: err.message || 'Profile update failed' };
    }
  }
};

