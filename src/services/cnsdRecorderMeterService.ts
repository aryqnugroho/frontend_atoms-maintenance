import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  CnsdRecorderMeterRecordDetail,
  CnsdRecorderMeterRecordSummary,
  CnsdRecorderMeterListParams,
  CnsdRecorderMeterUpdatePayload,
  CnsdRecorderMeterRoleKey,
  CnsdRecorderMeterSectionMeta,
} from '@/types/cnsdRecorder';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Same convention as cnsdRadarMeterService — Bearer token from sessionStorage only.
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

export const cnsdRecorderMeterService = {
  async listRecords(params: CnsdRecorderMeterListParams = {}): Promise<PaginatedApiResponse<CnsdRecorderMeterRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/cnsd/recorder-meter`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<CnsdRecorderMeterRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/cnsd/recorder-meter/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getTemplate(): Promise<{
    form_type: string;
    facility: string;
    form_code_default: string;
    merk_default: string;
    type_default: string;
    serial_number_default: string;
    sections: CnsdRecorderMeterSectionMeta[];
  }> {
    const response = await axios.get(`${API_URL}/v1/cnsd/recorder-meter/template`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/cnsd/recorder-meter/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  /**
   * Create a new Recorder Meter record. Backend auto-fills personnel from rostering.
   * On 409, the response includes the existing record so the UI can navigate to it.
   */
  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    facility?: string;
    location?: string;
    form_code?: string;
    merk?: string;
    type?: string;
    serial_number?: string | null;
  }): Promise<CnsdRecorderMeterRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/cnsd/recorder-meter`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(id: number, payload: CnsdRecorderMeterUpdatePayload): Promise<CnsdRecorderMeterRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/cnsd/recorder-meter/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: CnsdRecorderMeterRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: CnsdRecorderMeterRoleKey; record: CnsdRecorderMeterRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/cnsd/recorder-meter/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/cnsd/recorder-meter/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
