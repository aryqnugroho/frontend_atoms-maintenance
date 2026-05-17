import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ROSTERING_LOGIN_URL =
  import.meta.env.VITE_ROSTERING_FRONTEND_URL
    ? `${import.meta.env.VITE_ROSTERING_FRONTEND_URL}/login`
    : 'http://localhost:5174/login';

/**
 * LoginPage — atoms-maintenance tidak punya login sendiri.
 * Semua autentikasi dilakukan di atoms-rostering.
 *
 * Jika sudah login → langsung ke dashboard.
 * Jika belum → redirect ke atoms-rostering login.
 */
export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.replace(ROSTERING_LOGIN_URL);
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF1F8]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-[#222E6A]/30 border-t-[#222E6A] animate-spin" />
        <p className="text-sm text-slate-500">Mengarahkan ke halaman login…</p>
      </div>
    </div>
  );
};
