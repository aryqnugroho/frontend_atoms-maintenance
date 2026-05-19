import axios from 'axios';
import type { LogbookTfpDetail, LogbookTfpSummary, TfpEquipment } from '@/types/logbookTfp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface LogbookTfpListParams {
  year?: string | number;
  month?: string | number;
  signed?: 'yes' | 'no';
  per_page?: number;
}

export const logbookTfpService = {
  async listLogbooks(params: LogbookTfpListParams = {}): Promise<PaginatedResponse<LogbookTfpSummary>> {
    const response = await axios.get(`${API_URL}/v1/logbook/tfp`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getLogbook(id: number): Promise<LogbookTfpDetail> {
    const response = await axios.get(`${API_URL}/v1/logbook/tfp/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/logbook/tfp/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async getEquipments(): Promise<TfpEquipment[]> {
    const response = await axios.get(`${API_URL}/v1/logbook/tfp/equipments`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as TfpEquipment[];
  },

  async createLogbook(date: string): Promise<LogbookTfpDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/tfp`, { date }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signLogbook(id: number, signature: string): Promise<LogbookTfpDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/tfp/${id}/sign`, { signature }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateItems(
    id: number,
    items: Array<{ id: number; status_pagi: string | null; status_siang: string | null; status_malam: string | null }>,
  ): Promise<LogbookTfpDetail> {
    const response = await axios.put(`${API_URL}/v1/logbook/tfp/${id}/items`, { items }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async addNote(
    id: number,
    payload: { shift: string; time: string | null; activity: string },
  ): Promise<LogbookTfpDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/tfp/${id}/notes`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteNote(id: number, noteId: number): Promise<LogbookTfpDetail> {
    const response = await axios.delete(`${API_URL}/v1/logbook/tfp/${id}/notes/${noteId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteLogbook(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/logbook/tfp/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
