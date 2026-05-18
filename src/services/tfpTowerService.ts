import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  TfpTowerRecordDetail,
  TfpTowerRecordSummary,
  TfpTowerListParams,
  TfpTowerUpdatePayload,
  TfpTowerRoleKey,
} from '@/types/tfpTower';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

interface PaginatedApiResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const tfpTowerService = {
  async listRecords(params: TfpTowerListParams = {}): Promise<PaginatedApiResponse<TfpTowerRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/tfp/tower`, { headers: getAuthHeaders(), params: { per_page: 100, ...params } });
    return response.data.data;
  },

  async getRecord(id: number): Promise<TfpTowerRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/tfp/tower/${id}`, { headers: getAuthHeaders() });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/tfp/tower/years`, { headers: getAuthHeaders() });
    return response.data.data as number[];
  },

  async createRecord(payload: { date: string; shift_type: ShiftType; form_type?: string; location?: string }): Promise<TfpTowerRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/tfp/tower`, payload, { headers: getAuthHeaders() });
    return response.data.data;
  },

  async updateRecord(id: number, payload: TfpTowerUpdatePayload): Promise<TfpTowerRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/tower/${id}`, payload, { headers: getAuthHeaders() });
    return response.data.data;
  },

  async signRecord(id: number, role: TfpTowerRoleKey, signature: string, technicianRowId?: number): Promise<{ signed_role: TfpTowerRoleKey; record: TfpTowerRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;
    const response = await axios.post(`${API_URL}/v1/tfp/tower/${id}/sign`, body, { headers: getAuthHeaders() });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/tfp/tower/${id}`, { headers: getAuthHeaders() });
  },
};
