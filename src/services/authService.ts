import axios from 'axios';
import type { LoginCredentials, LoginResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Auth service for atoms-maintenance.
 *
 * In production, login is handled by atoms-rostering.
 * atoms-maintenance only needs:
 *   - verify(): validate a rostering Sanctum token on app load
 *   - logout(): clear local session (token revocation is at atoms-rostering)
 *
 * The login() method is kept for mock dev mode only.
 */
export const authService = {
  /**
   * Mock dev login only. In production, login happens at atoms-rostering.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/v1/auth/login`, credentials);
    return response.data.data;
  },

  /**
   * Verify a Sanctum token received from atoms-rostering (via ?token URL param).
   * Calls GET /api/v1/auth/verify — a public endpoint on atoms-maintenance backend.
   *
   * Returns the resolved user data on success, throws on failure.
   */
  async verify(token: string): Promise<{ user: import('@/types').User }> {
    const response = await axios.get(`${API_URL}/v1/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Response shape: { success, message, data: { valid, user } }
    return response.data.data;
  },

  /**
   * Clear local session. Token revocation at atoms-rostering is the
   * frontend's responsibility (redirect to rostering logout).
   */
  async logout(): Promise<void> {
    const token = sessionStorage.getItem('auth_token');
    if (!token) return;
    try {
      await axios.post(
        `${API_URL}/v1/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // Ignore — we clear local state regardless
    }
  },
};
