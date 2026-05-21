import axios from 'axios';
import type { CnsdEquipment, LogbookCnsdDetail, LogbookCnsdSummary } from '@/types/logbookCnsd';

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

export interface LogbookCnsdListParams {
  year?: string | number;
  month?: string | number;
  signed?: 'yes' | 'no';
  per_page?: number;
}

export interface UpdateItemPayload {
  id: number;
  status_pagi?: string | null;
  status_siang?: string | null;
  status_malam?: string | null;
  value_pagi?: string | null;
  value_siang?: string | null;
  value_malam?: string | null;
}

export const logbookCnsdService = {
  async listLogbooks(params: LogbookCnsdListParams = {}): Promise<PaginatedResponse<LogbookCnsdSummary>> {
    const response = await axios.get(`${API_URL}/v1/logbook/cnsd`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getLogbook(id: number): Promise<LogbookCnsdDetail> {
    const response = await axios.get(`${API_URL}/v1/logbook/cnsd/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/logbook/cnsd/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async getEquipments(): Promise<CnsdEquipment[]> {
    const response = await axios.get(`${API_URL}/v1/logbook/cnsd/equipments`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as CnsdEquipment[];
  },

  async createLogbook(date: string): Promise<LogbookCnsdDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/cnsd`, { date }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /** Sign one shift's slot. Backend validates signer is the assigned manager for that shift. */
  async signLogbook(id: number, shift: 'pagi' | 'siang' | 'malam', signature: string): Promise<LogbookCnsdDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/cnsd/${id}/sign`, { shift, signature }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateItems(id: number, items: UpdateItemPayload[]): Promise<LogbookCnsdDetail> {
    const response = await axios.put(`${API_URL}/v1/logbook/cnsd/${id}/items`, { items }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /** Bulk-mark one shift for all items. status=null → reset. overwrite=false → skip already-marked. */
  async bulkSetShiftStatus(
    id: number,
    payload: { shift: 'pagi' | 'siang' | 'malam'; status: 'S' | 'US' | null; overwrite?: boolean },
  ): Promise<LogbookCnsdDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/cnsd/${id}/bulk-status`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async addNote(
    id: number,
    payload: { shift: string; time: string | null; activity: string },
  ): Promise<LogbookCnsdDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/cnsd/${id}/notes`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteNote(id: number, noteId: number): Promise<LogbookCnsdDetail> {
    const response = await axios.delete(`${API_URL}/v1/logbook/cnsd/${id}/notes/${noteId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async addEquipment(id: number, name: string, category: string): Promise<LogbookCnsdDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/cnsd/${id}/equipments`, { name, category }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async editEquipment(id: number, itemId: number, data: { name?: string; category?: string }): Promise<LogbookCnsdDetail> {
    const response = await axios.put(`${API_URL}/v1/logbook/cnsd/${id}/equipments/${itemId}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async removeEquipment(id: number, itemId: number): Promise<LogbookCnsdDetail> {
    const response = await axios.delete(`${API_URL}/v1/logbook/cnsd/${id}/equipments/${itemId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteLogbook(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/logbook/cnsd/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
