import axios from 'axios';
import type {
  CnsdLocalizerMeterRecordSummary,
  CnsdLocalizerMeterRecordDetail,
  CnsdLocalizerMeterCreatePayload,
  CnsdLocalizerMeterUpdatePayload,
  CnsdLocalizerMeterSignPayload,
} from '@/types/cnsdLocalizer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE = `${API_URL}/v1/cnsd/localizer-meter`;

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

export const cnsdLocalizerMeterService = {
  async listRecords(params: Record<string, string | number> = {}): Promise<PaginatedApiResponse<CnsdLocalizerMeterRecordSummary>> {
    const res = await axios.get<ApiResponse<PaginatedApiResponse<CnsdLocalizerMeterRecordSummary>>>(BASE, { headers: getAuthHeaders(), params });
    return res.data.data;
  },
  async getYears(): Promise<number[]> {
    const res = await axios.get<ApiResponse<number[]>>(`${BASE}/years`, { headers: getAuthHeaders() });
    return res.data.data;
  },
  async createRecord(payload: CnsdLocalizerMeterCreatePayload): Promise<CnsdLocalizerMeterRecordDetail> {
    const res = await axios.post<ApiResponse<CnsdLocalizerMeterRecordDetail>>(BASE, payload, { headers: getAuthHeaders() });
    return res.data.data;
  },
  async getRecord(id: number): Promise<CnsdLocalizerMeterRecordDetail> {
    const res = await axios.get<ApiResponse<CnsdLocalizerMeterRecordDetail>>(`${BASE}/${id}`, { headers: getAuthHeaders() });
    return res.data.data;
  },
  async updateRecord(id: number, payload: CnsdLocalizerMeterUpdatePayload): Promise<CnsdLocalizerMeterRecordDetail> {
    const res = await axios.put<ApiResponse<CnsdLocalizerMeterRecordDetail>>(`${BASE}/${id}`, payload, { headers: getAuthHeaders() });
    return res.data.data;
  },
  async signRecord(id: number, payload: CnsdLocalizerMeterSignPayload): Promise<CnsdLocalizerMeterRecordDetail> {
    const res = await axios.post<ApiResponse<{ signed_role: string; record: CnsdLocalizerMeterRecordDetail }>>(
      `${BASE}/${id}/sign`, payload, { headers: getAuthHeaders() },
    );
    return res.data.data.record;
  },
  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${BASE}/${id}`, { headers: getAuthHeaders() });
  },
};
