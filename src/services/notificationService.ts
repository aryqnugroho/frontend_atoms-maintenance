import axios from 'axios';
import type { Notification, PaginatedResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function authHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ListNotificationsResponse {
  data: PaginatedResponse<Notification>;
  message: string;
}

export const notificationService = {
  async list(perPage = 20): Promise<Notification[]> {
    const res = await axios.get<{ data: PaginatedResponse<Notification>; message: string }>(
      `${API_URL}/v1/notifications`,
      { headers: authHeaders(), params: { per_page: perPage } }
    );
    return res.data.data.data ?? [];
  },

  async markAsRead(id: string | number): Promise<void> {
    await axios.put(`${API_URL}/v1/notifications/${id}/read`, null, { headers: authHeaders() });
  },

  async markAllAsRead(): Promise<void> {
    await axios.put(`${API_URL}/v1/notifications/read-all`, null, { headers: authHeaders() });
  },
};
