import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  TfpAobGroundRecordDetail,
  TfpAobGroundRecordSummary,
  TfpAobGroundListParams,
  TfpAobGroundUpdatePayload,
  TfpAobGroundRoleKey,
} from '@/types/tfpAobGround';

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

export const tfpAobGroundService = {
  async listRecords(
    params: TfpAobGroundListParams = {},
  ): Promise<PaginatedApiResponse<TfpAobGroundRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/tfp/aob-ground`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/tfp/aob-ground/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/tfp/aob-ground/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    location?: string;
  }): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/tfp/aob-ground`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(
    id: number,
    payload: TfpAobGroundUpdatePayload,
  ): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/aob-ground/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: TfpAobGroundRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: TfpAobGroundRoleKey; record: TfpAobGroundRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/tfp/aob-ground/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/tfp/aob-ground/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // ─── Structural edit (Manager / Supervisor / Admin only) ─────
  // All eight return the refreshed detail record so callers can
  // setRecord() directly without a follow-up GET.

  async addParameter(
    id: number,
    payload: { parameter_name: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/aob-ground/${id}/parameters`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateParameter(
    id: number,
    paramId: number,
    payload: { parameter_name?: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-ground/${id}/parameters/${paramId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteParameter(id: number, paramId: number): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/aob-ground/${id}/parameters/${paramId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderParameters(id: number, orderedIds: number[]): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-ground/${id}/parameters-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async addFacility(
    id: number,
    payload: { facility_name: string },
  ): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/aob-ground/${id}/facilities`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateFacility(
    id: number,
    facilityId: number,
    payload: { facility_name?: string },
  ): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-ground/${id}/facilities/${facilityId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteFacility(id: number, facilityId: number): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/aob-ground/${id}/facilities/${facilityId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderFacilities(id: number, orderedIds: number[]): Promise<TfpAobGroundRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/aob-ground/${id}/facilities-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },
};
