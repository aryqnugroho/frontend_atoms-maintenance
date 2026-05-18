import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  TfpGlidepathRecordDetail, TfpGlidepathRecordSummary, TfpGlidepathListParams,
  TfpGlidepathUpdatePayload, TfpGlidepathRoleKey,
} from '@/types/tfpGlidepath';

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

export const tfpGlidepathService = {
  async listRecords(params: TfpGlidepathListParams = {}): Promise<PaginatedApiResponse<TfpGlidepathRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/tfp/glidepath`, { headers: getAuthHeaders(), params: { per_page: 100, ...params } });
    return response.data.data;
  },
  async getRecord(id: number): Promise<TfpGlidepathRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/tfp/glidepath/${id}`, { headers: getAuthHeaders() });
    return response.data.data;
  },
  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/tfp/glidepath/years`, { headers: getAuthHeaders() });
    return response.data.data as number[];
  },
  async createRecord(payload: { date: string; shift_type: ShiftType; form_type?: string; location?: string }): Promise<TfpGlidepathRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/tfp/glidepath`, payload, { headers: getAuthHeaders() });
    return response.data.data;
  },
  async updateRecord(id: number, payload: TfpGlidepathUpdatePayload): Promise<TfpGlidepathRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/glidepath/${id}`, payload, { headers: getAuthHeaders() });
    return response.data.data;
  },
  async signRecord(id: number, role: TfpGlidepathRoleKey, signature: string, technicianRowId?: number): Promise<{ signed_role: TfpGlidepathRoleKey; record: TfpGlidepathRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;
    const response = await axios.post(`${API_URL}/v1/tfp/glidepath/${id}/sign`, body, { headers: getAuthHeaders() });
    return response.data.data;
  },
  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/tfp/glidepath/${id}`, { headers: getAuthHeaders() });
  },
};
