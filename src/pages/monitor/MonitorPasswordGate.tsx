import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Lock, Monitor as MonitorIcon } from 'lucide-react';
import { monitorService } from '@/services/monitorService';

interface MonitorPasswordGateProps {
  onUnlock: () => void;
}

/**
 * Decode why the verify request failed. Distinguishing "server tidak nyala"
 * vs "tabel belum di-migrate" vs "password salah" is the difference between
 * a useful error and a frustrating one for the kiosk operator.
 */
function extractMonitorVerifyError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return 'Terjadi kesalahan tidak terduga.';
  }

  // No response at all → network/CORS/backend-down
  if (!err.response) {
    return 'Tidak dapat terhubung ke server. Pastikan backend ATOMS-Maintenance berjalan di port 8000.';
  }

  const status = err.response.status;
  const data = err.response.data as { message?: string } | undefined;
  const msg = data?.message;

  if (status === 401) return 'Password salah.';

  // 404 — route missing (controller belum ter-load atau cache route stale)
  if (status === 404) {
    return 'Endpoint monitor belum tersedia. Coba jalankan `php artisan route:clear` di backend.';
  }

  // 500 + table-not-exist message → migration belum jalan
  if (status === 500 && msg && /app_settings|relation .* does not exist/i.test(msg)) {
    return 'Tabel app_settings belum dibuat. Jalankan `php artisan migrate` di backend.';
  }

  // Surface the backend's own message when present (more useful than generic)
  if (msg) return msg;

  return `Gagal terhubung ke server (HTTP ${status}).`;
}

/**
 * Full-screen password gate for the workshop TV monitor.
 *
 * Not a normal Modal — this is the entire screen until the password is
 * verified. After a successful verify the unlock callback fires and
 * MonitorPage takes over.
 *
 * The "unlock token" is stored as `monitor_unlocked = '1'` in sessionStorage
 * so a browser refresh during the same session does not re-prompt.
 * Closing the tab clears it. There is no persistent localStorage flag —
 * matching the SSO token-storage policy used elsewhere in the app.
 */
export const MonitorPasswordGate: React.FC<MonitorPasswordGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Autofocus the password field so a kiosk operator with a keyboard
    // can just start typing.
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError('Masukkan password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await monitorService.verifyPassword(password);
      if (ok) {
        sessionStorage.setItem('monitor_unlocked', '1');
        onUnlock();
      } else {
        setError('Password salah.');
      }
    } catch (err) {
      setError(extractMonitorVerifyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-primary to-blue-700 px-8 py-6 text-white">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                <MonitorIcon size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Workshop Monitor</h1>
                <p className="text-xs text-white/70 leading-tight">
                  ATOMS-Maintenance · AirNav Surabaya
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label
                htmlFor="monitor-password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password Monitor
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  id="monitor-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Hubungi Manager Teknik / Supervisor untuk mendapatkan password.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              {isSubmitting ? 'Memverifikasi...' : 'Buka Monitor'}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 py-3 border-t border-gray-100 bg-slate-50 text-[11px] text-slate-400 text-center">
            Tekan layar penuh (F11) untuk tampilan kiosk optimal.
          </div>
        </div>
      </div>
    </div>
  );
};
