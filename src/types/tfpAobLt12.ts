// ─── TFP Performance Check AOB Lantai 1 & 2 ──────────────────────────────
//
// Type definitions for the TFP AOB Lt 1&2 module.
// Key difference from AOB Ground: 6 single-value panel columns (no Input/Output split).

import type { ShiftType } from '@/types';

export type TfpAobLt12Status = 'ongoing' | 'on_hold' | 'completed';
export type TfpAobLt12RoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpAobLt12SignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpAobLt12TechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpAobLt12Item {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  panel_a05_app_room: string | null;
  panel_a06_app_room: string | null;
  panel_a07_app_room: string | null;
  panel_a08_gudang_lt1: string | null;
  panel_a22_gudang_lt1: string | null;
  panel_a09_amsc_room: string | null;
  /** Map of column keys → true if that cell is disabled/grey */
  is_disabled_map: Record<string, boolean> | null;
  sort_order: number;
}

export interface TfpAobLt12Facility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpAobLt12RecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpAobLt12Status;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpAobLt12RecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpAobLt12Status;
  manager: TfpAobLt12SignerInfo | null;
  supervisor: TfpAobLt12SignerInfo | null;
  technicians: TfpAobLt12TechnicianRow[];
  items: TfpAobLt12Item[];
  facilities: TfpAobLt12Facility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpAobLt12ListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpAobLt12UpdatePayload {
  items: Array<{
    id: number;
    panel_a05_app_room?: string | null;
    panel_a06_app_room?: string | null;
    panel_a07_app_room?: string | null;
    panel_a08_gudang_lt1?: string | null;
    panel_a22_gudang_lt1?: string | null;
    panel_a09_amsc_room?: string | null;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}
