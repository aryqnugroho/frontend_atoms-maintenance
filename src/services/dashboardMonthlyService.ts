import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/** A configured target (from settings). */
export interface MonthlyTarget {
  id: number;
  module_key: string;
  min_count: number;
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

/** One completed record contributing toward a target's monthly count. */
export interface MonthlySummaryRecord {
  id: number;
  date: string; // YYYY-MM-DD
}

export interface MonthlySummaryItem {
  id: number;
  module_key: string;
  label: string;
  division: 'CNSD' | 'TFP';
  group: string;
  route: string;
  min_count: number;
  current_count: number;
  met: boolean;
  sort_order: number;
  records: MonthlySummaryRecord[];
}

export interface MonthlySummary {
  year: number;
  month: number;
  month_label: string;
  items: MonthlySummaryItem[];
  targets_total: number;
  targets_met: number;
}

export interface MonthlyTargetCreatePayload {
  module_key: string;
  min_count: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface MonthlyTargetUpdatePayload {
  min_count?: number;
  sort_order?: number;
  is_active?: boolean;
}

export const dashboardMonthlyService = {
  async getSummary(year?: number, month?: number): Promise<MonthlySummary> {
    const params: Record<string, number> = {};
    if (year)  params.year = year;
    if (month) params.month = month;
    const r = await axios.get(`${API_URL}/v1/dashboard/monthly/summary`, { headers: getAuthHeaders(), params });
    return r.data.data as MonthlySummary;
  },

  async listTargets(): Promise<MonthlyTarget[]> {
    const r = await axios.get(`${API_URL}/v1/dashboard/monthly/targets`, { headers: getAuthHeaders() });
    return r.data.data as MonthlyTarget[];
  },

  async createTarget(payload: MonthlyTargetCreatePayload): Promise<MonthlyTarget> {
    const r = await axios.post(`${API_URL}/v1/dashboard/monthly/targets`, payload, { headers: getAuthHeaders() });
    return r.data.data as MonthlyTarget;
  },

  async updateTarget(id: number, payload: MonthlyTargetUpdatePayload): Promise<MonthlyTarget> {
    const r = await axios.put(`${API_URL}/v1/dashboard/monthly/targets/${id}`, payload, { headers: getAuthHeaders() });
    return r.data.data as MonthlyTarget;
  },

  async deleteTarget(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/dashboard/monthly/targets/${id}`, { headers: getAuthHeaders() });
  },

  async reorderTargets(items: Array<{ id: number; sort_order: number }>): Promise<void> {
    await axios.post(`${API_URL}/v1/dashboard/monthly/targets/reorder`, { items }, { headers: getAuthHeaders() });
  },
};
