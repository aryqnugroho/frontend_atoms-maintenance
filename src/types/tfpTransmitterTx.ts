// ─── TFP Performance Check Gedung (Transmitter) TX ───────────────────────
//
// Cells are dynamic: the record carries a `columns_config` defining panels
// and sub-columns; each item stores values + is_disabled_map + merge_map keyed
// by composite "panelId.subKey" (e.g. "panel_cos_tx03.input").

import type { ShiftType } from '@/types';

export type TfpTransmitterTxStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpTransmitterTxRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpTransmitterTxSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpTransmitterTxTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

// ─── Dynamic columns ─────────────────────────────────────────────────────

export interface TfpTransmitterTxSubColumn {
  key: string;
  label: string;
}

export interface TfpTransmitterTxPanel {
  id: string;
  label: string;
  sub_columns: TfpTransmitterTxSubColumn[];
}

export type TfpTransmitterTxColumnsConfig = TfpTransmitterTxPanel[];
export type TfpTransmitterTxCellKey = string;

export interface TfpTransmitterTxItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  values: Record<TfpTransmitterTxCellKey, string>;
  is_disabled_map: Record<TfpTransmitterTxCellKey, boolean>;
  merge_map: Record<TfpTransmitterTxCellKey, number>;
  sort_order: number;
}

export interface TfpTransmitterTxFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpTransmitterTxRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpTransmitterTxStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpTransmitterTxRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  columns_config: TfpTransmitterTxColumnsConfig;
  status: TfpTransmitterTxStatus;
  manager: TfpTransmitterTxSignerInfo | null;
  supervisor: TfpTransmitterTxSignerInfo | null;
  technicians: TfpTransmitterTxTechnicianRow[];
  items: TfpTransmitterTxItem[];
  facilities: TfpTransmitterTxFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpTransmitterTxListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpTransmitterTxUpdatePayload {
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpTransmitterTxCellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpTransmitterTxSaveStructurePayload {
  columns_config: TfpTransmitterTxColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpTransmitterTxCellKey, boolean>;
    merge_map?: Record<TfpTransmitterTxCellKey, number>;
  }>;
}
