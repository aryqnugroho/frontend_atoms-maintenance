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

export type ChecklistDivision = 'CNSD' | 'TFP';
export type ChecklistCategory = 'wajib' | 'shift';

export interface ChecklistItem {
  key: string;
  division: ChecklistDivision;
  category: ChecklistCategory;
  shift: ShiftType | null;
  label: string;
  route: string;
  has_record: boolean;
  record_id: number | null;
}

export interface WorkOrderSummary {
  has_shift_wo: boolean;
  shift_wo_id: number | null;
  ongoing_count: number;
}

export interface ShiftChecklistResponse {
  date: string;
  shift_type: ShiftType;
  items: ChecklistItem[];
  work_orders: {
    cnsd: WorkOrderSummary;
    tfp: WorkOrderSummary;
  };
}

export const dashboardService = {
  async getShiftChecklist(date: string, shiftType: ShiftType): Promise<ShiftChecklistResponse> {
    const response = await axios.get(`${API_URL}/v1/dashboard/shift-checklist`, {
      headers: getAuthHeaders(),
      params: { date, shift_type: shiftType },
    });
    return response.data.data;
  },
};
