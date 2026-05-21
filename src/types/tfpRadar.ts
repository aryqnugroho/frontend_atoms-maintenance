// ─── TFP Performance Check Gedung Radar ──────────────────────────────────
//
// Cells are dynamic: the record carries a `columns_config` defining panels
// and sub-columns; each item stores values + is_disabled_map + merge_map keyed
// by composite "panelId.subKey" (e.g. "panel_cos_rd03.input").

import type { ShiftType } from '@/types';

export type TfpRadarStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpRadarRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpRadarSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpRadarTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpRadarSubColumn {
  key: string;
  label: string;
}

export interface TfpRadarPanel {
  id: string;
  label: string;
  sub_columns: TfpRadarSubColumn[];
}

export type TfpRadarColumnsConfig = TfpRadarPanel[];
export type TfpRadarCellKey = string;

export interface TfpRadarItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  values: Record<TfpRadarCellKey, string>;
  is_disabled_map: Record<TfpRadarCellKey, boolean>;
  merge_map: Record<TfpRadarCellKey, number>;
  sort_order: number;
}

export interface TfpRadarFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpRadarRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpRadarStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpRadarRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  columns_config: TfpRadarColumnsConfig;
  status: TfpRadarStatus;
  manager: TfpRadarSignerInfo | null;
  supervisor: TfpRadarSignerInfo | null;
  technicians: TfpRadarTechnicianRow[];
  items: TfpRadarItem[];
  facilities: TfpRadarFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpRadarListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpRadarUpdatePayload {
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpRadarCellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpRadarSaveStructurePayload {
  columns_config: TfpRadarColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpRadarCellKey, boolean>;
    merge_map?: Record<TfpRadarCellKey, number>;
  }>;
}
