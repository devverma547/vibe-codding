import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { supabase } from '../config/supabase';

// Mock Supabase client
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      verifyOtp: vi.fn(),
      signInWithOAuth: vi.fn()
    }
  }
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location for redirect URLs
    global.window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000'
      },
      writable: true
    });
  });

  describe('signup', () => {
    it('returns success and data on valid signup', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token' };
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await authService.signup({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { name: 'Test User' },
          emailRedirectTo: 'http://localhost:3000/dashboard'
        }
      });
      expect(result).toEqual({
        success: true,
        data: mockUser,
        session: mockSession,
        requiresConfirmation: false
      });
    });

    it('returns error on failed signup', async () => {
      supabase.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already in use' }
      });

      const result = await authService.signup({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(result).toEqual({
        success: false,
        error: 'Email already in use'
      });
    });
  });

  describe('login', () => {
    it('returns success and data on valid login', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token' };
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await authService.login({ email: 'test@example.com', password: 'password123' });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result).toEqual({ success: true, data: mockUser, session: mockSession });
    });

    it('returns error on failed login', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      const result = await authService.login({ email: 'test@example.com', password: 'wrong' });

      expect(result).toEqual({ success: false, error: 'Invalid credentials' });
    });
  });

  describe('logout', () => {
    it('returns success on successful logout', async () => {
      supabase.auth.signOut.mockResolvedValueOnce({ error: null });

      const result = await authService.logout();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('returns error on failed logout', async () => {
      supabase.auth.signOut.mockResolvedValueOnce({ error: { message: 'Network error' } });

      const result = await authService.logout();

      expect(result).toEqual({ success: false, error: 'Network error' });
    });
  });

  describe('getCurrentUser', () => {
    it('returns user if authenticated', async () => {
      const mockUser = { id: '123' };
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      const result = await authService.getCurrentUser();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('returns null if not authenticated or error', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'No session' } });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
