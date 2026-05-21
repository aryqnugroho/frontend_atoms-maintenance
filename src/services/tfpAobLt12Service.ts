import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  TfpAobLt12RecordDetail,
  TfpAobLt12RecordSummary,
  TfpAobLt12ListParams,
  TfpAobLt12UpdatePayload,
  TfpAobLt12SaveStructurePayload,
  TfpAobLt12RoleKey,
} from '@/types/tfpAobLt12';

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

export const tfpAobLt12Service = {
  async listRecords(
    params: TfpAobLt12ListParams = {},
  ): Promise<PaginatedApiResponse<TfpAobLt12RecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/tfp/aob-lt12`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.get(`${API_URL}/v1/tfp/aob-lt12/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/tfp/aob-lt12/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    location?: string;
  }): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.post(`${API_URL}/v1/tfp/aob-lt12`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(
    id: number,
    payload: TfpAobLt12UpdatePayload,
  ): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/aob-lt12/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: TfpAobLt12RoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: TfpAobLt12RoleKey; record: TfpAobLt12RecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/tfp/aob-lt12/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/tfp/aob-lt12/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // ─── Structural edit (Manager / Supervisor / Admin only) ─────

  async saveStructure(
    id: number,
    payload: TfpAobLt12SaveStructurePayload,
  ): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-lt12/${id}/structure`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async addParameter(
    id: number,
    payload: { parameter_name: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/aob-lt12/${id}/parameters`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateParameter(
    id: number,
    paramId: number,
    payload: { parameter_name?: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-lt12/${id}/parameters/${paramId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteParameter(id: number, paramId: number): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/aob-lt12/${id}/parameters/${paramId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderParameters(id: number, orderedIds: number[]): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-lt12/${id}/parameters-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async addFacility(
    id: number,
    payload: { facility_name: string },
  ): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/aob-lt12/${id}/facilities`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateFacility(
    id: number,
    facilityId: number,
    payload: { facility_name?: string },
  ): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-lt12/${id}/facilities/${facilityId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteFacility(id: number, facilityId: number): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/aob-lt12/${id}/facilities/${facilityId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderFacilities(id: number, orderedIds: number[]): Promise<TfpAobLt12RecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-lt12/${id}/facilities-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },
};
