import axios from 'axios';
import type { ShiftType } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Module entry from the backend DashboardModuleRegistry. Drives the
 * "pick a module" dropdown in the settings page.
 */
export interface ChecklistModule {
  key: string;
  label: string;
  division: 'CNSD' | 'TFP';
  group: string;
  route: string;
  model: string;
}

/**
 * Persisted checklist item. `module_missing=true` means the module_key no
 * longer exists in the registry — the row stays in DB but the dashboard
 * skips it; settings page should let the user remove the stale row.
 */
export interface ChecklistItem {
  id: number;
  module_key: string;
  category: 'wajib' | 'shift';
  shift_type: ShiftType | null;
  sort_order: number;
  is_active: boolean;
  module_missing: boolean;
  label: string;
  division: 'CNSD' | 'TFP' | null;
  group: string | null;
  route: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChecklistCreatePayload {
  module_key: string;
  category: 'wajib' | 'shift';
  shift_type?: ShiftType | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface ChecklistUpdatePayload {
  sort_order?: number;
  is_active?: boolean;
}

export const dashboardChecklistService = {
  async listModules(): Promise<ChecklistModule[]> {
    const r = await axios.get(`${API_URL}/v1/dashboard/checklist/modules`, { headers: getAuthHeaders() });
    return r.data.data as ChecklistModule[];
  },

  async listItems(): Promise<ChecklistItem[]> {
    const r = await axios.get(`${API_URL}/v1/dashboard/checklist/items`, { headers: getAuthHeaders() });
    return r.data.data as ChecklistItem[];
  },

  async createItem(payload: ChecklistCreatePayload): Promise<ChecklistItem> {
    const r = await axios.post(`${API_URL}/v1/dashboard/checklist/items`, payload, { headers: getAuthHeaders() });
    return r.data.data as ChecklistItem;
  },

  async updateItem(id: number, payload: ChecklistUpdatePayload): Promise<ChecklistItem> {
    const r = await axios.put(`${API_URL}/v1/dashboard/checklist/items/${id}`, payload, { headers: getAuthHeaders() });
    return r.data.data as ChecklistItem;
  },

  async deleteItem(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/dashboard/checklist/items/${id}`, { headers: getAuthHeaders() });
  },

  async reorderItems(items: Array<{ id: number; sort_order: number }>): Promise<void> {
    await axios.post(`${API_URL}/v1/dashboard/checklist/items/reorder`, { items }, { headers: getAuthHeaders() });
  },
};
