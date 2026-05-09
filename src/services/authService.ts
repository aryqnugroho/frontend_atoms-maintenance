import axios from 'axios';
import type { LoginCredentials, LoginResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data.data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
