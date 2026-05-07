import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { mockUsers } from '@/data/mockData';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login, updateUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      window.location.href = '/dashboard';
    } catch {
      // Fallback: try mock login
      const mockUser = mockUsers.find(
        (u) => u.email === email
      );
      if (mockUser) {
        updateUser(mockUser);
        window.location.href = '/dashboard';
      } else {
        setError('Email atau password salah. Coba: user@airnav.co.id');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8ECF4] via-[#F0F2F8] to-[#E0E5F0] p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 animate-fade-slide-up">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-3">
              <img src="/assets/icon/logoairnav.svg" alt="AirNav" className="h-12 w-auto" data-no-transition />
              <span className="text-2xl font-bold text-sidebar tracking-tight">ATOMS</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Welcome Back!</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to access your account.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-scale-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="example@airnav.co.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2 h-11 text-base font-semibold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <p className="text-[11px] text-slate-400 text-center mt-6">
            By continuing, you agree to our Terms & Conditions and Privacy Policy.
          </p>
        </div>

        {/* Branding */}
        <p className="text-[11px] text-slate-400 text-center mt-6">
          ATOMS-Maintenance System &copy; {new Date().getFullYear()} AirNav Indonesia
        </p>
      </div>
    </div>
  );
};
