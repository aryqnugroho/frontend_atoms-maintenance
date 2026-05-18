import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  CnsdTransmitterMeterRecordDetail,
  CnsdTransmitterMeterRecordSummary,
} from '@/types/cnsdTransmitter';

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

export interface CnsdTransmitterMeterListParams {
  search?: string;
  date?: string;
  year?: string | number;
  shift_type?: ShiftType;
  status?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
}

export interface CnsdTransmitterMeterUpdatePayload {
  items: Array<{
    id: number;
    status_value?: string | null;
    power_output?: string | null;
    modulasi?: string | null;
    keterangan?: string | null;
    hasil?: string | null;
  }>;
}

export type CnsdTransmitterMeterRoleKey = 'manager' | 'supervisor' | 'technician';

export const cnsdTransmitterMeterService = {
  async listRecords(params: CnsdTransmitterMeterListParams = {}): Promise<PaginatedApiResponse<CnsdTransmitterMeterRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/cnsd/transmitter-meter`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<CnsdTransmitterMeterRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/cnsd/transmitter-meter/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getTemplate(): Promise<unknown> {
    const response = await axios.get(`${API_URL}/v1/cnsd/transmitter-meter/template`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/cnsd/transmitter-meter/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    facility?: string;
    form_code?: string;
    location?: string;
  }): Promise<CnsdTransmitterMeterRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/cnsd/transmitter-meter`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(id: number, payload: CnsdTransmitterMeterUpdatePayload): Promise<CnsdTransmitterMeterRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/cnsd/transmitter-meter/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: CnsdTransmitterMeterRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: CnsdTransmitterMeterRoleKey; record: CnsdTransmitterMeterRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/cnsd/transmitter-meter/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/cnsd/transmitter-meter/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
