// ─── TFP Performance Check Gedung DVOR ───────────────────────────────────
//
// Cells are dynamic: the record carries a `columns_config` defining panels
// and sub-columns; each item stores values + is_disabled_map + merge_map keyed
// by composite "panelId.subKey" (e.g. "panel_ats_d06.input").

import type { ShiftType } from '@/types';

export type TfpDvorStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpDvorRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpDvorSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpDvorTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpDvorSubColumn {
  key: string;
  label: string;
}

export interface TfpDvorPanel {
  id: string;
  label: string;
  sub_columns: TfpDvorSubColumn[];
}

export type TfpDvorColumnsConfig = TfpDvorPanel[];
export type TfpDvorCellKey = string;

export interface TfpDvorItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  values: Record<TfpDvorCellKey, string>;
  is_disabled_map: Record<TfpDvorCellKey, boolean>;
  merge_map: Record<TfpDvorCellKey, number>;
  sort_order: number;
}

export interface TfpDvorFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpDvorRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpDvorStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpDvorRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  columns_config: TfpDvorColumnsConfig;
  status: TfpDvorStatus;
  manager: TfpDvorSignerInfo | null;
  supervisor: TfpDvorSignerInfo | null;
  technicians: TfpDvorTechnicianRow[];
  items: TfpDvorItem[];
  facilities: TfpDvorFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpDvorListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpDvorUpdatePayload {
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpDvorCellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpDvorSaveStructurePayload {
  columns_config: TfpDvorColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpDvorCellKey, boolean>;
    merge_map?: Record<TfpDvorCellKey, number>;
  }>;
}
