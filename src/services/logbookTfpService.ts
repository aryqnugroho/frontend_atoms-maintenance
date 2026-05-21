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

  /** Sign one shift's slot. Backend validates signer is the assigned manager for that shift. */
  async signLogbook(id: number, shift: 'pagi' | 'siang' | 'malam', signature: string): Promise<LogbookTfpDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/tfp/${id}/sign`, { shift, signature }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateItems(
    id: number,
    items: Array<{ id: number; status_pagi?: string | null; status_siang?: string | null; status_malam?: string | null }>,
  ): Promise<LogbookTfpDetail> {
    const response = await axios.put(`${API_URL}/v1/logbook/tfp/${id}/items`, { items }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /**
   * Bulk-mark one shift column for ALL items at once.
   *   status='S'  → mark all as Serviceable
   *   status='US' → mark all as Unserviceable
   *   status=null → reset all to empty
   *   overwrite=false → only fill items that are currently null (skip already-marked)
   */
  async bulkSetShiftStatus(
    id: number,
    payload: { shift: 'pagi' | 'siang' | 'malam'; status: 'S' | 'US' | null; overwrite?: boolean },
  ): Promise<LogbookTfpDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/tfp/${id}/bulk-status`, payload, {
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

  async addEquipment(id: number, name: string, category: string): Promise<LogbookTfpDetail> {
    const response = await axios.post(`${API_URL}/v1/logbook/tfp/${id}/equipments`, { name, category }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async editEquipment(id: number, itemId: number, data: { name?: string; category?: string }): Promise<LogbookTfpDetail> {
    const response = await axios.put(`${API_URL}/v1/logbook/tfp/${id}/equipments/${itemId}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async removeEquipment(id: number, itemId: number): Promise<LogbookTfpDetail> {
    const response = await axios.delete(`${API_URL}/v1/logbook/tfp/${id}/equipments/${itemId}`, {
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
