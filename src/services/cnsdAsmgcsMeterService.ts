import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  CnsdAsmgcsMeterRecordDetail,
  CnsdAsmgcsMeterRecordSummary,
  CnsdAsmgcsMeterListParams,
  CnsdAsmgcsMeterUpdatePayload,
  CnsdAsmgcsMeterRoleKey,
  CnsdAsmgcsMeterSectionMeta,
} from '@/types/cnsdAsmgcs';

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

export const cnsdAsmgcsMeterService = {
  async listRecords(params: CnsdAsmgcsMeterListParams = {}): Promise<PaginatedApiResponse<CnsdAsmgcsMeterRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/cnsd/asmgcs-meter`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<CnsdAsmgcsMeterRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/cnsd/asmgcs-meter/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getTemplate(): Promise<{
    form_type: string;
    facility: string;
    merk_default: string | null;
    type_default: string | null;
    serial_number_default: string | null;
    sections: CnsdAsmgcsMeterSectionMeta[];
  }> {
    const response = await axios.get(`${API_URL}/v1/cnsd/asmgcs-meter/template`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/cnsd/asmgcs-meter/years`, {
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
    merk?: string | null;
    type?: string | null;
    serial_number?: string | null;
  }): Promise<CnsdAsmgcsMeterRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/cnsd/asmgcs-meter`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(id: number, payload: CnsdAsmgcsMeterUpdatePayload): Promise<CnsdAsmgcsMeterRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/cnsd/asmgcs-meter/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: CnsdAsmgcsMeterRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: CnsdAsmgcsMeterRoleKey; record: CnsdAsmgcsMeterRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/cnsd/asmgcs-meter/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/cnsd/asmgcs-meter/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
