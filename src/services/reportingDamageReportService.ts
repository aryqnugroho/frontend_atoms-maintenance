import axios from 'axios';
import type {
  CreateReportingDamageReportPayload,
  ReportingDamageReportDetail,
  ReportingDamageReportSummary,
  ReportingPerson,
  ReportingSignRole,
  UpdateReportingDamageReportPayload,
} from '@/types/reporting';

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

export interface ReportingDamageReportListParams {
  search?: string;
  date?: string;
  year?: string | number;
  damage_category?: string;
  obstacle_code?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
}

export const reportingDamageReportService = {
  async listReports(
    params: ReportingDamageReportListParams = {},
  ): Promise<PaginatedApiResponse<ReportingDamageReportSummary>> {
    const response = await axios.get(`${API_URL}/v1/reporting/damage-reports`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getReport(id: number): Promise<ReportingDamageReportDetail> {
    const response = await axios.get(`${API_URL}/v1/reporting/damage-reports/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/reporting/damage-reports/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createReport(
    payload: CreateReportingDamageReportPayload,
  ): Promise<ReportingDamageReportDetail> {
    const response = await axios.post(`${API_URL}/v1/reporting/damage-reports`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateReport(
    id: number,
    payload: UpdateReportingDamageReportPayload,
  ): Promise<ReportingDamageReportDetail> {
    const response = await axios.put(`${API_URL}/v1/reporting/damage-reports/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signReport(
    id: number,
    role: ReportingSignRole,
    signature: string,
    repairerRowId?: number,
  ): Promise<{ signed_role: ReportingSignRole; record: ReportingDamageReportDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (repairerRowId) body.repairer_row_id = repairerRowId;

    const response = await axios.post(`${API_URL}/v1/reporting/damage-reports/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteReport(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/reporting/damage-reports/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // ─── Personnel selectors ─────────────────────────────────────

  async getManagers(search?: string): Promise<ReportingPerson[]> {
    const response = await axios.get(`${API_URL}/v1/reporting/personnel`, {
      headers: getAuthHeaders(),
      params: { scope: 'manager', search: search || undefined },
    });
    return response.data.data as ReportingPerson[];
  },

  async getRepairers(search?: string, division?: string): Promise<ReportingPerson[]> {
    const response = await axios.get(`${API_URL}/v1/reporting/personnel`, {
      headers: getAuthHeaders(),
      params: {
        scope: 'repairer',
        search: search || undefined,
        division: division || undefined,
      },
    });
    return response.data.data as ReportingPerson[];
  },
};
