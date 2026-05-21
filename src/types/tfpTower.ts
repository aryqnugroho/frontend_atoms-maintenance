// ─── TFP Performance Check Gedung Tower ──────────────────────────────────
//
// Cells are dynamic: the record carries a `columns_config` defining panels
// and sub-columns; each item stores values + is_disabled_map + merge_map keyed
// by composite "panelId.subKey" (e.g. "panel_ats_a13.input").

import type { ShiftType } from '@/types';

export type TfpTowerStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpTowerRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpTowerSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpTowerTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpTowerSubColumn {
  key: string;
  label: string;
}

export interface TfpTowerPanel {
  id: string;
  label: string;
  sub_columns: TfpTowerSubColumn[];
}

export type TfpTowerColumnsConfig = TfpTowerPanel[];
export type TfpTowerCellKey = string;

export interface TfpTowerItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  values: Record<TfpTowerCellKey, string>;
  is_disabled_map: Record<TfpTowerCellKey, boolean>;
  merge_map: Record<TfpTowerCellKey, number>;
  sort_order: number;
}

export interface TfpTowerFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpTowerRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpTowerStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpTowerRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  columns_config: TfpTowerColumnsConfig;
  status: TfpTowerStatus;
  manager: TfpTowerSignerInfo | null;
  supervisor: TfpTowerSignerInfo | null;
  technicians: TfpTowerTechnicianRow[];
  items: TfpTowerItem[];
  facilities: TfpTowerFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpTowerListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpTowerUpdatePayload {
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpTowerCellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpTowerSaveStructurePayload {
  columns_config: TfpTowerColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpTowerCellKey, boolean>;
    merge_map?: Record<TfpTowerCellKey, number>;
  }>;
}
