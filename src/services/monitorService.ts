import axios from 'axios';
import type { ShiftType } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Public monitor (kiosk) endpoints ───────────────────────────────────────
// These do NOT carry any auth header. The kiosk gate is a UI-only password
// modal that calls /verify before allowing the screen to render. The
// snapshot endpoint is unauthenticated by design (see MonitorController).

export type MonitorShiftType = ShiftType;

export interface MonitorPersonnel {
  name: string;
  role: string;
  employee_type: string;
}

export interface MonitorChecklistItem {
  key: string;
  division: 'CNSD' | 'TFP';
  category: 'wajib' | 'shift';
  shift: MonitorShiftType | null;
  label: string;
  has_record: boolean;
}

/**
 * Per-role signature status for a WO row on the kiosk.
 * `null` means the role is not required for this WO (e.g. supervisor when
 * has_supervisor=false, or all three for a gm_directive).
 * `true` = sudah TTD, `false` = belum TTD.
 */
export interface MonitorWorkOrderSignatureStatus {
  technician: boolean | null;
  supervisor: boolean | null;
  mt: boolean | null;
}

export interface MonitorWorkOrder {
  id: number;
  wo_number: string;
  wo_type: 'shift' | 'personal' | 'gm_directive';
  division: 'CNSD' | 'TFP';
  shift_type: MonitorShiftType;
  shift_date: string | null;
  description: string;
  status: 'ongoing' | 'on_hold' | 'completed';
  manager_name: string | null;
  technician_name: string | null;
  is_gm_directive: boolean;
  signature_status: MonitorWorkOrderSignatureStatus;
}

export interface MonitorDamageReport {
  id: number;
  report_number: string;
  report_date: string;
  equipment_name: string;
  facility: string;
  location: string;
  damage_category: string;
  status: 'ongoing' | 'on_hold' | 'completed';
}

export interface MonitorLogbookNote {
  division: 'CNSD' | 'TFP';
  shift: MonitorShiftType;
  time: string | null;
  activity: string;
  is_auto: boolean;
}

export interface MonitorSnapshot {
  server_time: string;
  date: string;
  shift: {
    type: MonitorShiftType;
    label: string;
    start_time: string | null;
    end_time: string | null;
  };
  personnel: {
    roster_available: boolean;
    manager: { name: string } | null;
    supervisor_cnsd: { name: string } | null;
    supervisor_tfp: { name: string } | null;
    cnsd: MonitorPersonnel[];
    tfp: MonitorPersonnel[];
  };
  checklist: {
    items: MonitorChecklistItem[];
    wajib_total: number;
    wajib_done: number;
    shift_total: number;
    shift_done: number;
  };
  monthly: {
    year: number;
    month: number;
    month_label: string;
    items: Array<{
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
      records: Array<{ id: number; date: string }>;
    }>;
    targets_total: number;
    targets_met: number;
  };
  work_orders: MonitorWorkOrder[];
  damage_reports: MonitorDamageReport[];
  logbook: {
    date: string;
    source_date: string;
    is_fallback: boolean;
    fallback_shift: MonitorShiftType | null;
    total_count: number;
    cnsd_count: number;
    tfp_count: number;
    notes: MonitorLogbookNote[];
  };
}

export const monitorService = {
  /** Verify the kiosk password. Returns true on match, throws on bad password. */
  async verifyPassword(password: string): Promise<boolean> {
    const response = await axios.post(`${API_URL}/v1/public/monitor/verify`, { password });
    return Boolean(response.data?.data?.ok);
  },

  /** Single-shot aggregate snapshot for the kiosk. */
  async getSnapshot(): Promise<MonitorSnapshot> {
    const response = await axios.get(`${API_URL}/v1/public/monitor/snapshot`);
    return response.data.data as MonitorSnapshot;
  },

  /**
   * Rotate the kiosk password. Requires an authenticated session (carried by
   * the regular Authorization header from sessionStorage) and an eligible role.
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = sessionStorage.getItem('auth_token');
    await axios.put(
      `${API_URL}/v1/monitor/password`,
      { current_password: currentPassword, new_password: newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  },
};
