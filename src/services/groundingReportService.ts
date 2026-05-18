import axios from 'axios';
import type { ShiftType } from '@/types';
import type { GroundingReportDetail, GroundingReportSummary } from '@/types/grounding';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

export interface GroundingReportListParams {
  search?: string;
  date?: string;
  year?: string | number;
  shift_type?: ShiftType;
  status?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
}

export interface GroundingReportUpdatePayload {
  items: Array<{
    id: number;
    availability?: string | null;
    condition?: string | null;
    notes?: string | null;
  }>;
}

export type GroundingReportRoleKey = 'manager' | 'supervisor' | 'technician';

export const groundingReportService = {
  async listRecords(params: GroundingReportListParams = {}): Promise<PaginatedApiResponse<GroundingReportSummary>> {
    const response = await axios.get(`${API_URL}/v1/grounding/reports`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<GroundingReportDetail> {
    const response = await axios.get(`${API_URL}/v1/grounding/reports/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getTemplate(): Promise<{ sections: Array<{ name: string; items: Array<{ item_number: number; item_name: string; standard: string | null }> }> }> {
    const response = await axios.get(`${API_URL}/v1/grounding/reports/template`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/grounding/reports/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    equipment_name: string;
    equipment_location: string;
    work_unit?: string;
  }): Promise<GroundingReportDetail> {
    const response = await axios.post(`${API_URL}/v1/grounding/reports`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(id: number, payload: GroundingReportUpdatePayload): Promise<GroundingReportDetail> {
    const response = await axios.put(`${API_URL}/v1/grounding/reports/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: GroundingReportRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: GroundingReportRoleKey; record: GroundingReportDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/grounding/reports/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/grounding/reports/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
