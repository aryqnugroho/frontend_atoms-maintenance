import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ROSTERING_LOGIN_URL =
  import.meta.env.VITE_ROSTERING_FRONTEND_URL
    ? `${import.meta.env.VITE_ROSTERING_FRONTEND_URL}/login`
    : 'http://localhost:5174/login';

/**
 * ProtectedRoute
 *
 * Guards all authenticated routes.
 *
 * - While auth is initialising (token verification in progress): show spinner.
 * - If not authenticated after init:
 *     Mock dev mode → redirect to /login (mock login form)
 *     Production    → redirect to atoms-rostering login (external)
 * - If authenticated: render child routes.
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const isMockMode = import.meta.env.VITE_DEV_MOCK_AUTH === 'true';

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-[#EEF1F8]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin" />
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isMockMode) {
      // In mock dev mode, show the local login form
      return <Navigate to="/login" replace />;
    }
    // In production, redirect to atoms-rostering login
    window.location.href = ROSTERING_LOGIN_URL;
    return null;
  }

  return <Outlet />;
};
