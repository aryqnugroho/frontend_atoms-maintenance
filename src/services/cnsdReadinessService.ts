import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  CnsdReadinessRecordDetail,
  CnsdReadinessRecordSummary,
  CnsdReadinessTemplateSection,
  CnsdReadinessListParams,
  CnsdReadinessUpdatePayload,
  CnsdReadinessRoleKey,
} from '@/types/cnsd';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Same convention as workOrderService — Bearer token from sessionStorage only.
 */
function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

interface PaginatedApiResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const cnsdReadinessService = {
  async listRecords(params: CnsdReadinessListParams = {}): Promise<PaginatedApiResponse<CnsdReadinessRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/cnsd/readiness`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<CnsdReadinessRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/cnsd/readiness/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getTemplate(): Promise<{ form_type: string; sections: CnsdReadinessTemplateSection[] }> {
    const response = await axios.get(`${API_URL}/v1/cnsd/readiness/template`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/cnsd/readiness/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  /**
   * Create a new readiness record. Backend auto-fills personnel from rostering.
   * On 409, the response includes the existing record so the UI can navigate to it.
   */
  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    facility?: string;
    location?: string;
    room?: string;
  }): Promise<CnsdReadinessRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/cnsd/readiness`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(id: number, payload: CnsdReadinessUpdatePayload): Promise<CnsdReadinessRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/cnsd/readiness/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: CnsdReadinessRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: CnsdReadinessRoleKey; record: CnsdReadinessRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/cnsd/readiness/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/cnsd/readiness/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
