// ─── TFP Performance Check AOB Lantai 1 & 2 ──────────────────────────────
//
// Cells are dynamic: the record carries a `columns_config` defining panels
// and sub-columns; each item stores values + is_disabled_map + merge_map keyed
// by composite "panelId.subKey" (e.g. "panel_a05_app_room.value").

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

// ─── Dynamic columns ─────────────────────────────────────────────────────────

export interface TfpAobLt12SubColumn {
  key: string;
  label: string;
}

export interface TfpAobLt12Panel {
  id: string;
  label: string;
  sub_columns: TfpAobLt12SubColumn[];
}

export type TfpAobLt12ColumnsConfig = TfpAobLt12Panel[];

export type TfpAobLt12CellKey = string;

export interface TfpAobLt12Item {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  values: Record<TfpAobLt12CellKey, string>;
  is_disabled_map: Record<TfpAobLt12CellKey, boolean>;
  merge_map: Record<TfpAobLt12CellKey, number>;
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
  columns_config: TfpAobLt12ColumnsConfig;
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
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpAobLt12CellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpAobLt12SaveStructurePayload {
  columns_config: TfpAobLt12ColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpAobLt12CellKey, boolean>;
    merge_map?: Record<TfpAobLt12CellKey, number>;
  }>;
}
