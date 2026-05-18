import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  CnsdAmscMeterRecordDetail,
  CnsdAmscMeterRecordSummary,
  CnsdAmscMeterListParams,
  CnsdAmscMeterUpdatePayload,
  CnsdAmscMeterRoleKey,
  CnsdAmscMeterSectionMeta,
} from '@/types/cnsdAmsc';

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

export const cnsdAmscMeterService = {
  async listRecords(params: CnsdAmscMeterListParams = {}): Promise<PaginatedApiResponse<CnsdAmscMeterRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/cnsd/amsc-meter`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<CnsdAmscMeterRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/cnsd/amsc-meter/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getTemplate(): Promise<{
    form_type: string;
    facility: string;
    merk_default: string;
    type_default: string;
    serial_number_default: string;
    sections: CnsdAmscMeterSectionMeta[];
  }> {
    const response = await axios.get(`${API_URL}/v1/cnsd/amsc-meter/template`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/cnsd/amsc-meter/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    facility?: string;
    location?: string;
    merk?: string;
    type?: string;
    serial_number?: string | null;
  }): Promise<CnsdAmscMeterRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/cnsd/amsc-meter`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(id: number, payload: CnsdAmscMeterUpdatePayload): Promise<CnsdAmscMeterRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/cnsd/amsc-meter/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: CnsdAmscMeterRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: CnsdAmscMeterRoleKey; record: CnsdAmscMeterRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/cnsd/amsc-meter/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/cnsd/amsc-meter/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
