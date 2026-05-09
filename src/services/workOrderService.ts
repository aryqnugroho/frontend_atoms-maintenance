import axios from 'axios';
import type { WorkOrder, PaginatedResponse, WOType, ShiftType } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Get the Authorization header with the Bearer token.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Work Order query parameters for filtering and pagination.
 */
export interface WorkOrderQueryParams {
  division?: string;
  status?: string;
  shift_date?: string;
  shift_type?: string;
  wo_type?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

/**
 * Personnel item returned by the API.
 */
export interface PersonnelItem {
  id: number;
  name: string;
  email: string;
  role: string;
  division: string | null;
}

/**
 * Payload for creating a work order via API.
 */
export interface CreateWorkOrderPayload {
  wo_type: WOType;
  division: 'CNSD' | 'TFP';
  shift_type: ShiftType;
  shift_date: string;
  description: string;
  manager_id?: number;
  supervisor_id?: number;
  assigned_technician_id?: number;
  personnel: { user_id: number; role_label: string }[];
  output_types: string[];
  output_other?: string;
  notes_kendala?: string;
  notes_usulan?: string;
  notes_pemberi_tugas?: string;
}

/**
 * Payload for updating a work order via API.
 */
export interface UpdateWorkOrderPayload {
  wo_type?: WOType;
  division?: 'CNSD' | 'TFP';
  shift_type?: ShiftType;
  shift_date?: string;
  description?: string;
  status?: string;
  manager_id?: number;
  supervisor_id?: number;
  assigned_technician_id?: number;
  personnel?: { user_id: number; role_label: string }[];
  output_types?: string[];
  output_other?: string;
  start_time?: string;
  end_time?: string;
  completion_status?: string;
  notes_kendala?: string;
  notes_usulan?: string;
  notes_pemberi_tugas?: string;
}

/**
 * Work Order API service.
 */
export const workOrderService = {
  /**
   * Get paginated list of work orders with optional filters.
   */
  async getWorkOrders(params?: WorkOrderQueryParams): Promise<PaginatedResponse<WorkOrder>> {
    const response = await axios.get(`${API_URL}/v1/work-orders`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data.data;
  },

  /**
   * Get a single work order by ID.
   */
  async getWorkOrder(id: number): Promise<WorkOrder> {
    const response = await axios.get(`${API_URL}/v1/work-orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /**
   * Create a new work order.
   */
  async createWorkOrder(data: CreateWorkOrderPayload): Promise<WorkOrder> {
    const response = await axios.post(`${API_URL}/v1/work-orders`, data, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /**
   * Update an existing work order.
   */
  async updateWorkOrder(id: number, data: UpdateWorkOrderPayload): Promise<WorkOrder> {
    const response = await axios.put(`${API_URL}/v1/work-orders/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /**
   * Delete a work order (soft-delete).
   */
  async deleteWorkOrder(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/work-orders/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  /**
   * Get the list of active personnel for form dropdowns.
   */
  async getPersonnel(params?: { division?: string; role?: string }): Promise<PersonnelItem[]> {
    const response = await axios.get(`${API_URL}/v1/personnel`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data.data;
  },
};
