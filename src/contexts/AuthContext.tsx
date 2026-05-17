import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials } from '@/types';
import { authService } from '@/services/authService';
import { AuthContext } from '@/contexts/contextInstances';

/**
 * AuthProvider — SSO-aware auth context for atoms-maintenance.
 *
 * Token lifecycle:
 *   1. On app load, check URL for ?token query param (set by atoms-rostering redirect).
 *   2. If found: validate via GET /api/v1/auth/verify, store in sessionStorage, clean URL.
 *   3. If not found: check sessionStorage for an existing token from this session.
 *   4. If neither: redirect to atoms-rostering login page.
 *
 * Storage: sessionStorage only — never localStorage.
 * This means the session ends when the browser tab is closed, which is correct
 * for a delegated-auth system where atoms-rostering owns the session.
 *
 * Mock dev mode (VITE_DEV_MOCK_AUTH=true):
 *   The login() method is still available for the mock login flow.
 *   Token is stored as mock-token-{id} in sessionStorage.
 *
 * StrictMode safety:
 *   The init flow is wrapped in a module-level singleton promise so React
 *   StrictMode's double-invocation of useEffect cannot trigger a duplicate
 *   verify request or — critically — race-redirect to rostering login while
 *   the first verify is still in flight (the bug that caused users to bounce
 *   back to the rostering login page after clicking Maintenance).
 */

const ROSTERING_LOGIN_URL =
  import.meta.env.VITE_ROSTERING_FRONTEND_URL
    ? `${import.meta.env.VITE_ROSTERING_FRONTEND_URL}/login`
    : 'http://localhost:5174/login';

const SESSION_TOKEN_KEY   = 'auth_token';
const SESSION_USER_KEY    = 'auth_user';
// Temporary key: holds the URL token while verify() is in-flight.
// Written at module load, cleared after verify succeeds or fails.
const SESSION_PENDING_KEY = 'auth_pending_token';

// ── Capture ?token from URL at module load ────────────────────────────────
// Done here (outside React) so it runs exactly once per page load,
// before any React lifecycle or StrictMode double-invoke can interfere.
{
  const _params = new URLSearchParams(window.location.search);
  const _t = _params.get('token');
  if (_t) {
    // Park the token in sessionStorage so initAuth() can read it reliably
    // even if StrictMode runs useEffect twice.
    sessionStorage.setItem(SESSION_PENDING_KEY, _t);
    // Strip token from URL immediately — don't leave it in browser history.
    _params.delete('token');
    const _newSearch = _params.toString();
    window.history.replaceState(
      {},
      '',
      window.location.pathname + (_newSearch ? `?${_newSearch}` : '')
    );
    // Safe debug: presence only, no token contents.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[SSO] received token from URL, length:', _t.length);
    }
  }
}

// ── Module-level singleton: runs exactly once per page load ──────────────
// Both StrictMode-invoked useEffects share the same promise, eliminating
// the race where the 2nd invocation reads empty storage and redirects to
// rostering before the 1st invocation's verify() completes.
type InitResult =
  | { status: 'authed'; token: string; user: User }
  | { status: 'redirect' }
  | { status: 'no-auth' };

let initAuthPromise: Promise<InitResult> | null = null;

const persistSession = (tok: string, usr: User) => {
  sessionStorage.setItem(SESSION_TOKEN_KEY, tok);
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(usr));
  // Ensure no stale localStorage tokens remain (SSO constraint: sessionStorage only)
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

const clearSession = () => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(SESSION_PENDING_KEY);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

const ensureInitialized = (): Promise<InitResult> => {
  if (initAuthPromise) return initAuthPromise;

  initAuthPromise = (async (): Promise<InitResult> => {
    // ── Step 1: Check for a pending SSO token (from atoms-rostering redirect) ─
    const pendingToken = sessionStorage.getItem(SESSION_PENDING_KEY);

    if (pendingToken) {
      // Clear the pending marker eagerly so a leftover stale token cannot
      // trigger a duplicate verify on a later page load.
      sessionStorage.removeItem(SESSION_PENDING_KEY);

      try {
        const result = await authService.verify(pendingToken);
        if (result?.user) {
          persistSession(pendingToken, result.user as User);
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[SSO] token verified, user:', (result.user as User).name);
          }
          return { status: 'authed', token: pendingToken, user: result.user as User };
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('[SSO] verify failed:', err);
        }
        // Token invalid or backend unreachable — fall through to redirect
      }

      // Token was invalid — clear everything and tell caller to redirect
      clearSession();
      return { status: 'redirect' };
    }

    // ── Step 2: Check sessionStorage for existing session ───────────────────
    const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const storedUser  = sessionStorage.getItem(SESSION_USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        return { status: 'authed', token: storedToken, user: parsed };
      } catch {
        // Corrupted storage — clear and fall through
        clearSession();
      }
    }

    // ── Step 3: No token anywhere ────────────────────────────────────────────
    return { status: 'no-auth' };
  })();

  return initAuthPromise;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ensureInitialized().then((result) => {
      if (cancelled) return;

      if (result.status === 'authed') {
        setToken(result.token);
        setUser(result.user);
        setIsLoading(false);
        return;
      }

      if (result.status === 'redirect') {
        // Verify failed — bounce to rostering login
        setIsLoading(false);
        window.location.href = ROSTERING_LOGIN_URL;
        return;
      }

      // status === 'no-auth'
      const isMockMode = import.meta.env.VITE_DEV_MOCK_AUTH === 'true';
      if (!isMockMode) {
        setIsLoading(false);
        window.location.href = ROSTERING_LOGIN_URL;
        return;
      }

      // Mock dev mode: stay on /login so the mock form can render
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Mock dev login (VITE_DEV_MOCK_AUTH=true only) ─────────────────────────
  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    const { access_token, user: userData } = response;
    persistSession(access_token, userData as User);
    setToken(access_token);
    setUser(userData as User);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors — clear local state regardless
    } finally {
      clearSession();
      setToken(null);
      setUser(null);
      // Redirect to atoms-rostering login
      window.location.href = ROSTERING_LOGIN_URL;
    }
  };

  // ── Update user (e.g. after profile change) ───────────────────────────────
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
    // Ensure token is still set if it was missing (mock mode edge case)
    if (!token) {
      const mockToken = `mock-token-${updatedUser.id}`;
      setToken(mockToken);
      sessionStorage.setItem(SESSION_TOKEN_KEY, mockToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
