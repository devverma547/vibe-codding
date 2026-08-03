/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription = null;

    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (log in, log out, etc.)
    try {
      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session) {
            setUser(session.user);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
          setIsLoading(false);
        }
      );
      subscription = data?.subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setIsLoading(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success) {
        setUser(res.data);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
      return res;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (data) => {
    setIsLoading(true);
    try {
      const res = await authService.signup(data);
      if (res.success) {
        setUser(res.data);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
      return res;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const forgotPassword = async (email) => {
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyEmail = async (code) => {
    try {
      return await authService.verifyEmail(code);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const googleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await authService.googleSignIn();
      setIsLoading(false);
      return res;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    setIsLoading(true);
    try {
      const res = await authService.updateProfile(updates);
      if (res.success) {
        setUser(res.data);
      }
      setIsLoading(false);
      return res;
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    forgotPassword,
    verifyEmail,
    googleSignIn,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-gray-100">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm animate-pulse">Initializing session...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

