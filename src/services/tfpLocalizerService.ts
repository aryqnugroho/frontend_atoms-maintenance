import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  TfpLocalizerRecordDetail,
  TfpLocalizerRecordSummary,
  TfpLocalizerListParams,
  TfpLocalizerUpdatePayload,
  TfpLocalizerSaveStructurePayload,
  TfpLocalizerRoleKey,
} from '@/types/tfpLocalizer';

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

export const tfpLocalizerService = {
  async listRecords(
    params: TfpLocalizerListParams = {},
  ): Promise<PaginatedApiResponse<TfpLocalizerRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/tfp/localizer`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/tfp/localizer/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/tfp/localizer/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    location?: string;
  }): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/tfp/localizer`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(
    id: number,
    payload: TfpLocalizerUpdatePayload,
  ): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/localizer/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: TfpLocalizerRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: TfpLocalizerRoleKey; record: TfpLocalizerRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/tfp/localizer/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/tfp/localizer/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // ─── Structural edit (Manager / Supervisor / Admin only) ─────

  async saveStructure(
    id: number,
    payload: TfpLocalizerSaveStructurePayload,
  ): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/localizer/${id}/structure`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async addParameter(
    id: number,
    payload: { parameter_name: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/localizer/${id}/parameters`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateParameter(
    id: number,
    paramId: number,
    payload: { parameter_name?: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/localizer/${id}/parameters/${paramId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteParameter(id: number, paramId: number): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/localizer/${id}/parameters/${paramId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderParameters(id: number, orderedIds: number[]): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/localizer/${id}/parameters-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async addFacility(
    id: number,
    payload: { facility_name: string },
  ): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/localizer/${id}/facilities`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateFacility(
    id: number,
    facilityId: number,
    payload: { facility_name?: string },
  ): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/localizer/${id}/facilities/${facilityId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteFacility(id: number, facilityId: number): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/localizer/${id}/facilities/${facilityId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderFacilities(id: number, orderedIds: number[]): Promise<TfpLocalizerRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/localizer/${id}/facilities-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },
};
