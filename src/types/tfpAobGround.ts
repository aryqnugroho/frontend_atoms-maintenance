// ─── TFP Performance Check AOB Lantai Ground ──────────────────────────────
//
// Type definitions for the TFP AOB Ground module.
// Cells are dynamic now: the record carries a `columns_config` defining panels
// and sub-columns; each item stores values + is_disabled_map + merge_map keyed
// by composite "panelId.subKey" (e.g. "panel_cos_a03.input").

import type { ShiftType } from '@/types';

export type TfpAobGroundStatus = 'ongoing' | 'on_hold' | 'completed';
export type TfpAobGroundRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpAobGroundSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpAobGroundTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

// ─── Dynamic columns ─────────────────────────────────────────────────────────

export interface TfpAobGroundSubColumn {
  key: string;   // stable slug e.g. "input", "output", "bypass"
  label: string; // human label e.g. "Input"
}

export interface TfpAobGroundPanel {
  id: string;       // stable slug e.g. "panel_cos_a03"
  label: string;    // human label e.g. "Panel COS (A 03)"
  sub_columns: TfpAobGroundSubColumn[];
}

export type TfpAobGroundColumnsConfig = TfpAobGroundPanel[];

// Composite cell key shape: "panelId.subKey" (e.g. "panel_cos_a03.input")
export type TfpAobGroundCellKey = string;

export interface TfpAobGroundItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  /** cellKey → value */
  values: Record<TfpAobGroundCellKey, string>;
  /** cellKey → true if grey/disabled */
  is_disabled_map: Record<TfpAobGroundCellKey, boolean>;
  /** cellKey → colspan (≥2 means this cell spans N cells to the right) */
  merge_map: Record<TfpAobGroundCellKey, number>;
  sort_order: number;
}

export interface TfpAobGroundFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpAobGroundRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpAobGroundStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpAobGroundRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  columns_config: TfpAobGroundColumnsConfig;
  status: TfpAobGroundStatus;
  manager: TfpAobGroundSignerInfo | null;
  supervisor: TfpAobGroundSignerInfo | null;
  technicians: TfpAobGroundTechnicianRow[];
  items: TfpAobGroundItem[];
  facilities: TfpAobGroundFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpAobGroundListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpAobGroundUpdatePayload {
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpAobGroundCellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpAobGroundSaveStructurePayload {
  columns_config: TfpAobGroundColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpAobGroundCellKey, boolean>;
    merge_map?: Record<TfpAobGroundCellKey, number>;
  }>;
}
