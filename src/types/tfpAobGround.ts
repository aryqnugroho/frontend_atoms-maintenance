// ─── TFP Performance Check AOB Lantai Ground ──────────────────────────────
//
// Type definitions for the TFP AOB Ground module.
// Mirrors the CNSD Recorder Meter shape but with TFP-specific item fields:
//   - panel_cos_a03_input/output  : Panel COS (A 03)
//   - panel_ats_a12_input/output  : Panel ATS (A 12)
//   - ups_tescom_a_input/output   : UPS TESCOM A
//   - ups_tescom_b_input/output   : UPS TESCOM B
//   - is_disabled_map             : which cells are grey/disabled

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

export interface TfpAobGroundItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  panel_cos_a03_input: string | null;
  panel_cos_a03_output: string | null;
  panel_ats_a12_input: string | null;
  panel_ats_a12_output: string | null;
  ups_tescom_a_input: string | null;
  ups_tescom_a_output: string | null;
  ups_tescom_b_input: string | null;
  ups_tescom_b_output: string | null;
  /** Map of column keys → true if that cell is disabled/grey */
  is_disabled_map: Record<string, boolean> | null;
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
  items: Array<{
    id: number;
    panel_cos_a03_input?: string | null;
    panel_cos_a03_output?: string | null;
    panel_ats_a12_input?: string | null;
    panel_ats_a12_output?: string | null;
    ups_tescom_a_input?: string | null;
    ups_tescom_a_output?: string | null;
    ups_tescom_b_input?: string | null;
    ups_tescom_b_output?: string | null;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}
