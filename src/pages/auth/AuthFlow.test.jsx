import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import AuthCallback from './AuthCallback';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AuthModal from '../../components/auth/AuthModal';
import { authService } from '../../services/auth.service';

// Mock ToastContext
const mockAddToast = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

// Mock authService
vi.mock('../../services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    verifyEmail: vi.fn(),
    googleSignIn: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock supabase
let authStateCallback = null;
vi.mock('../../config/supabase', () => ({
  initialUrlParams: { hash: '', search: '' },
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((cb) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
  },
}));

// Helper component to consume AuthContext state for testing
const TestConsumer = () => {
  const { user, isAuthenticated, isLoading, login, logout, updateProfile } = useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user ? user.email : 'none'}</div>
      <button data-testid="login-btn" onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button data-testid="update-btn" onClick={() => updateProfile({ name: 'New Name' })}>
        Update Profile
      </button>
    </div>
  );
};

describe('Auth Flow & State Propagation Harness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;
  });

  describe('AuthContext State Propagation', () => {
    it('initializes auth state correctly when user is already logged in', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: '123', email: 'user@test.com', email_confirmed_at: '2026-01-01' });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByText('Initializing session...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    });

    it('handles initialization when getCurrentUser returns null', async () => {
      authService.getCurrentUser.mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });

    it('updates state dynamically when onAuthStateChange fires SIGNED_IN event', async () => {
      authService.getCurrentUser.mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      act(() => {
        if (authStateCallback) {
          authStateCallback('SIGNED_IN', { user: { id: '456', email: 'oauth@test.com', email_confirmed_at: '2026-01-01' } });
        }
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      expect(screen.getByTestId('user')).toHaveTextContent('oauth@test.com');
    });

    it('clears state dynamically when onAuthStateChange fires SIGNED_OUT event', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: '123', email: 'user@test.com', email_confirmed_at: '2026-01-01' });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('yes'));

      act(() => {
        if (authStateCallback) {
          authStateCallback('SIGNED_OUT', null);
        }
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });

    it('handles login action and updates user state', async () => {
      authService.getCurrentUser.mockResolvedValue(null);
      authService.login.mockResolvedValue({
        success: true,
        data: { id: '789', email: 'test@example.com', email_confirmed_at: '2026-01-01' },
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    it('handles logout action gracefully', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: '123', email: 'user@test.com', email_confirmed_at: '2026-01-01' });
      authService.logout.mockResolvedValue({ success: true });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('yes'));

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });

    it('prevents updateProfile when unauthenticated', async () => {
      authService.getCurrentUser.mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByTestId('update-btn'));

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(authService.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('ProtectedRoute Routing & Email Verification Edge Cases', () => {
    it('redirects unauthenticated user to /login', async () => {
      authService.getCurrentUser.mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
              <Route path="/dashboard" element={<ProtectedRoute><div data-testid="protected-content">Secret</div></ProtectedRoute>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('redirects authenticated user with unverified email to /verify-email', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: '123', email: 'user@test.com', email_confirmed_at: null });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/verify-email" element={<div data-testid="verify-email-page">Verify Email</div>} />
              <Route path="/dashboard" element={<ProtectedRoute><div data-testid="protected-content">Secret</div></ProtectedRoute>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('verify-email-page')).toBeInTheDocument();
      });
    });

    it('allows access to protected route when email is confirmed', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: '123', email: 'user@test.com', email_confirmed_at: '2026-01-01T00:00:00Z' });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><div data-testid="protected-content">Secret</div></ProtectedRoute>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('LoginPage Component', () => {
    it('redirects to /dashboard if already authenticated', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: '123', email: 'user@test.com', email_confirmed_at: '2026-01-01' });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('triggers googleSignIn when Google button is clicked', async () => {
      authService.getCurrentUser.mockResolvedValue(null);
      authService.googleSignIn.mockResolvedValue({ success: true });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());

      const googleBtn = screen.getByRole('button', { name: /google/i });
      fireEvent.click(googleBtn);

      await waitFor(() => {
        expect(authService.googleSignIn).toHaveBeenCalledTimes(1);
      });
      expect(mockAddToast).toHaveBeenCalledWith('Redirecting to Google authentication...', 'info');
    });
  });

  describe('SignupPage Component', () => {
    it('redirects to /dashboard if already authenticated', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: '123', email: 'user@test.com', email_confirmed_at: '2026-01-01' });

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <AuthProvider>
            <Routes>
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });
  });

  describe('AuthCallback Component', () => {
    it('redirects to /dashboard when user becomes authenticated', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: '123', email: 'user@test.com', email_confirmed_at: '2026-01-01' });

      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <AuthProvider>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
      expect(mockAddToast).toHaveBeenCalledWith('Successfully authenticated!', 'success');
    });

    it('navigates to /login on error timeout if unauthenticated', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      authService.getCurrentUser.mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <AuthProvider>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/login" element={<div data-testid="login-page">Login</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Completing Authentication')).toBeInTheDocument();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
      expect(mockAddToast).toHaveBeenCalledWith(
        'Authentication took too long or failed. Please try logging in again.',
        'error'
      );
      vi.useRealTimers();
    });
  });

  describe('AuthModal Component & AuthContext Unmounting', () => {
    it('triggers googleSignIn action when clicked inside AuthModal', async () => {
      authService.getCurrentUser.mockResolvedValue(null);
      authService.googleSignIn.mockResolvedValue({ success: false, error: 'Google sign-in canceled' });

      const handleClose = vi.fn();

      render(
        <MemoryRouter>
          <AuthProvider>
            <AuthModal isOpen={true} onClose={handleClose} />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('Get Started with SiteProof')).toBeInTheDocument());

      const btn = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(btn);

      await waitFor(() => {
        expect(authService.googleSignIn).toHaveBeenCalledTimes(1);
      });
    });
  });
});
