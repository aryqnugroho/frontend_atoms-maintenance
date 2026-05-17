import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  CnsdRadarMeterRecordDetail,
  CnsdRadarMeterRecordSummary,
  CnsdRadarMeterListParams,
  CnsdRadarMeterUpdatePayload,
  CnsdRadarMeterRoleKey,
  CnsdRadarMeterSectionMeta,
} from '@/types/cnsdRadar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Same convention as cnsdReadinessService — Bearer token from sessionStorage only.
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

export const cnsdRadarMeterService = {
  async listRecords(params: CnsdRadarMeterListParams = {}): Promise<PaginatedApiResponse<CnsdRadarMeterRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/cnsd/radar-meter`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<CnsdRadarMeterRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/cnsd/radar-meter/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getTemplate(): Promise<{
    form_type: string;
    facility: string;
    merk_default: string;
    type_default: string;
    sections: CnsdRadarMeterSectionMeta[];
  }> {
    const response = await axios.get(`${API_URL}/v1/cnsd/radar-meter/template`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/cnsd/radar-meter/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  /**
   * Create a new Radar Meter record. Backend auto-fills personnel from rostering.
   * On 409, the response includes the existing record so the UI can navigate to it.
   */
  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    facility?: string;
    location?: string;
    merk?: string;
    type?: string;
    serial_number?: string | null;
  }): Promise<CnsdRadarMeterRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/cnsd/radar-meter`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(id: number, payload: CnsdRadarMeterUpdatePayload): Promise<CnsdRadarMeterRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/cnsd/radar-meter/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: CnsdRadarMeterRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: CnsdRadarMeterRoleKey; record: CnsdRadarMeterRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/cnsd/radar-meter/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/cnsd/radar-meter/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
