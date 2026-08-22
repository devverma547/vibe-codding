import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

/**
 * Helper to auto-retry dynamic module imports if a new build deployment invalidated chunk hashes
 */
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageRefreshed = JSON.parse(
      sessionStorage.getItem('page_refreshed_for_chunk_error') || 'false'
    );

    try {
      const component = await componentImport();
      sessionStorage.setItem('page_refreshed_for_chunk_error', 'false');
      return component;
    } catch (error) {
      if (!pageRefreshed) {
        sessionStorage.setItem('page_refreshed_for_chunk_error', 'true');
        window.location.reload();
        return { default: () => null };
      }
      throw error;
    }
  });
}

// Pages (Lazy Loaded with Auto-Retry for Route-Level Code Splitting)
const LandingPage = lazyWithRetry(() => import('./pages/landing/LandingPage'));
const LoginPage = lazyWithRetry(() => import('./pages/auth/LoginPage'));
const SignupPage = lazyWithRetry(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazyWithRetry(() => import('./pages/auth/VerifyEmailPage'));
const AuthCallback = lazyWithRetry(() => import('./pages/auth/AuthCallback'));
const DashboardPage = lazyWithRetry(() => import('./pages/dashboard/DashboardPage'));
const HistoryPage = lazyWithRetry(() => import('./pages/history/HistoryPage'));
const AboutPage = lazyWithRetry(() => import('./pages/about/AboutPage'));
const PricingPage = lazyWithRetry(() => import('./pages/pricing/PricingPage'));
const ContactPage = lazyWithRetry(() => import('./pages/contact/ContactPage'));
const ReportPage = lazyWithRetry(() => import('./pages/report/ReportPage'));
const SampleReportPage = lazyWithRetry(() => import('./pages/report/SampleReportPage'));
const NotFoundPage = lazyWithRetry(() => import('./pages/errors/NotFoundPage'));

/**
 * SiteProof Root Router
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-gray-100 font-sans flex flex-col selection:bg-[#00F5A0] selection:text-slate-950 transition-colors duration-300">
                <Navbar />
                <main className="flex-1 pt-16 flex flex-col">
                  <Suspense fallback={<LoadingScreen message="Loading page..." />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/sample-report" element={<SampleReportPage />} />

                      {/* Auth Routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />

                      {/* Protected Routes */}
                      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                      <Route path="/report/:reportId" element={<ReportPage />} />

                      {/* Error Routes */}
                      <Route path="/404" element={<NotFoundPage />} />
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}


export default App;
