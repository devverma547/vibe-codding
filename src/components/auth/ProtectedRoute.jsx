import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading securely...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Guard to prevent unverified email users from accessing protected routes
  // This applies to both email/password signups and any OAuth providers that may leave the email unverified
  if (user && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}
