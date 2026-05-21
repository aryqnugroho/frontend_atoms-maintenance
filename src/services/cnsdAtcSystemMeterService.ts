import axios from 'axios';
import type {
  CnsdAtcSystemMeterRecordSummary,
  CnsdAtcSystemMeterRecordDetail,
  CnsdAtcSystemMeterCreatePayload,
  CnsdAtcSystemMeterUpdatePayload,
  CnsdAtcSystemMeterSignPayload,
} from '@/types/cnsdAtcSystem';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE = `${API_URL}/v1/cnsd/atc-system-meter`;

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

export const cnsdAtcSystemMeterService = {
  async listRecords(params: Record<string, string | number> = {}): Promise<PaginatedApiResponse<CnsdAtcSystemMeterRecordSummary>> {
    const res = await axios.get<ApiResponse<PaginatedApiResponse<CnsdAtcSystemMeterRecordSummary>>>(BASE, { headers: getAuthHeaders(), params });
    return res.data.data;
  },
  async getYears(): Promise<number[]> {
    const res = await axios.get<ApiResponse<number[]>>(`${BASE}/years`, { headers: getAuthHeaders() });
    return res.data.data;
  },
  async createRecord(payload: CnsdAtcSystemMeterCreatePayload): Promise<CnsdAtcSystemMeterRecordDetail> {
    const res = await axios.post<ApiResponse<CnsdAtcSystemMeterRecordDetail>>(BASE, payload, { headers: getAuthHeaders() });
    return res.data.data;
  },
  async getRecord(id: number): Promise<CnsdAtcSystemMeterRecordDetail> {
    const res = await axios.get<ApiResponse<CnsdAtcSystemMeterRecordDetail>>(`${BASE}/${id}`, { headers: getAuthHeaders() });
    return res.data.data;
  },
  async updateRecord(id: number, payload: CnsdAtcSystemMeterUpdatePayload): Promise<CnsdAtcSystemMeterRecordDetail> {
    const res = await axios.put<ApiResponse<CnsdAtcSystemMeterRecordDetail>>(`${BASE}/${id}`, payload, { headers: getAuthHeaders() });
    return res.data.data;
  },
  async signRecord(id: number, payload: CnsdAtcSystemMeterSignPayload): Promise<CnsdAtcSystemMeterRecordDetail> {
    const res = await axios.post<ApiResponse<{ signed_role: string; record: CnsdAtcSystemMeterRecordDetail }>>(
      `${BASE}/${id}/sign`, payload, { headers: getAuthHeaders() },
    );
    return res.data.data.record;
  },
  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${BASE}/${id}`, { headers: getAuthHeaders() });
  },
};
