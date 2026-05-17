import axios from 'axios';
import type { WorkOrder, PaginatedResponse, WOType, ShiftType, WorkOrderSignatureRole, ShiftContextResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Get the Authorization header with the Bearer token.
 * Reads from sessionStorage (never localStorage — SSO constraint).
 */
function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Work Order query parameters for filtering and pagination.
 * All fields are sent as query params to the backend when non-empty/non-default.
 */
export interface WorkOrderQueryParams {
  division?: string;
  status?: string;
  shift_date?: string;  // YYYY-MM-DD
  shift_type?: string;  // pagi | siang | malam
  year?: string;        // four-digit year, e.g. "2026"
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
  description?: string;
  output_types?: string[];
  output_other?: string;
  start_time?: string;
  end_time?: string;
  completion_status?: string;
  notes_kendala?: string;
  notes_usulan?: string;
  notes_pemberi_tugas?: string;
  personnel?: { user_id: number; role_label: string }[];
}

export interface SignWorkOrderResponse {
  signed_role: WorkOrderSignatureRole;
  pending_roles: WorkOrderSignatureRole[];
  current_status: string;
  record: WorkOrder;
}

export interface WorkOrderPrintData {
  work_order: WorkOrder;
  required_signatures: WorkOrderSignatureRole[];
  pending_signatures: WorkOrderSignatureRole[];
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
   * Submit an immutable base64 PNG signature for a work order role.
   */
  async signWorkOrder(id: number, role: WorkOrderSignatureRole, signature: string): Promise<SignWorkOrderResponse> {
    const response = await axios.post(`${API_URL}/v1/work-orders/${id}/sign`, {
      role,
      signature,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /**
   * Get the full print payload for a work order.
   */
  async getWorkOrderPrintData(id: number): Promise<WorkOrderPrintData> {
    const response = await axios.get(`${API_URL}/v1/work-orders/${id}/print`, {
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
   * Get distinct years available in shift_date, descending.
   * Used to populate the year filter dropdown.
   */
  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/work-orders/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
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

  /**
   * Get real shift context from atoms-rostering (read-only).
   * Returns manager, supervisor, personnel list, shift times, and roster_available flag.
   * When roster_available = false, fall back to manual selection from local_users.
   *
   * @param shiftType 'pagi' | 'siang' | 'malam'
   * @param date      'YYYY-MM-DD' (defaults to today on backend if omitted)
   */
  async getShiftContext(shiftType?: ShiftType, date?: string): Promise<ShiftContextResponse> {
    const response = await axios.get(`${API_URL}/v1/personnel/shift-today`, {
      headers: getAuthHeaders(),
      params: {
        ...(shiftType && { shift_type: shiftType }),
        ...(date && { date }),
      },
    });
    return response.data.data;
  },
};
