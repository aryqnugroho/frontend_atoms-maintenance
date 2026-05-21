// ─── TFP Performance Check Gedung Localizer ──────────────────────────────
//
// Cells are dynamic: the record carries a `columns_config` defining panels
// and sub-columns; each item stores values + is_disabled_map + merge_map keyed
// by composite "panelId.subKey" (e.g. "panel_cos_lz02.input").

import type { ShiftType } from '@/types';

export type TfpLocalizerStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpLocalizerRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpLocalizerSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpLocalizerTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpLocalizerSubColumn {
  key: string;
  label: string;
}

export interface TfpLocalizerPanel {
  id: string;
  label: string;
  sub_columns: TfpLocalizerSubColumn[];
}

export type TfpLocalizerColumnsConfig = TfpLocalizerPanel[];
export type TfpLocalizerCellKey = string;

export interface TfpLocalizerItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  values: Record<TfpLocalizerCellKey, string>;
  is_disabled_map: Record<TfpLocalizerCellKey, boolean>;
  merge_map: Record<TfpLocalizerCellKey, number>;
  sort_order: number;
}

export interface TfpLocalizerFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpLocalizerRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpLocalizerStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpLocalizerRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  columns_config: TfpLocalizerColumnsConfig;
  status: TfpLocalizerStatus;
  manager: TfpLocalizerSignerInfo | null;
  supervisor: TfpLocalizerSignerInfo | null;
  technicians: TfpLocalizerTechnicianRow[];
  items: TfpLocalizerItem[];
  facilities: TfpLocalizerFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpLocalizerListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpLocalizerUpdatePayload {
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpLocalizerCellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpLocalizerSaveStructurePayload {
  columns_config: TfpLocalizerColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpLocalizerCellKey, boolean>;
    merge_map?: Record<TfpLocalizerCellKey, number>;
  }>;
}
