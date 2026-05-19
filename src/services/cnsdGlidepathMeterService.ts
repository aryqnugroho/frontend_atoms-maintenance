import axios from 'axios';
import type {
  CnsdGlidepathMeterRecordSummary,
  CnsdGlidepathMeterRecordDetail,
  CnsdGlidepathMeterCreatePayload,
  CnsdGlidepathMeterUpdatePayload,
  CnsdGlidepathMeterSignPayload,
} from '@/types/cnsdGlidepath';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE = `${API_URL}/v1/cnsd/glidepath-meter`;

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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}

export const cnsdGlidepathMeterService = {
  async listRecords(params: Record<string, string | number> = {}): Promise<PaginatedApiResponse<CnsdGlidepathMeterRecordSummary>> {
    const res = await axios.get<ApiResponse<PaginatedApiResponse<CnsdGlidepathMeterRecordSummary>>>(BASE, { headers: getAuthHeaders(), params });
    return res.data.data;
  },

  async getYears(): Promise<number[]> {
    const res = await axios.get<ApiResponse<number[]>>(`${BASE}/years`, { headers: getAuthHeaders() });
    return res.data.data;
  },

  async createRecord(payload: CnsdGlidepathMeterCreatePayload): Promise<CnsdGlidepathMeterRecordDetail> {
    const res = await axios.post<ApiResponse<CnsdGlidepathMeterRecordDetail>>(BASE, payload, { headers: getAuthHeaders() });
    return res.data.data;
  },

  async getRecord(id: number): Promise<CnsdGlidepathMeterRecordDetail> {
    const res = await axios.get<ApiResponse<CnsdGlidepathMeterRecordDetail>>(`${BASE}/${id}`, { headers: getAuthHeaders() });
    return res.data.data;
  },

  async updateRecord(id: number, payload: CnsdGlidepathMeterUpdatePayload): Promise<CnsdGlidepathMeterRecordDetail> {
    const res = await axios.put<ApiResponse<CnsdGlidepathMeterRecordDetail>>(`${BASE}/${id}`, payload, { headers: getAuthHeaders() });
    return res.data.data;
  },

  async signRecord(id: number, payload: CnsdGlidepathMeterSignPayload): Promise<CnsdGlidepathMeterRecordDetail> {
    const res = await axios.post<ApiResponse<{ signed_role: string; record: CnsdGlidepathMeterRecordDetail }>>(
      `${BASE}/${id}/sign`, payload, { headers: getAuthHeaders() },
    );
    return res.data.data.record;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${BASE}/${id}`, { headers: getAuthHeaders() });
  },
};
