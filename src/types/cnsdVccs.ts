// ─── CNSD VCCS Meter Reading — Form VCCS-METER (VCCS LES) ────
//
// Type definitions for the CNSD VCCS Meter Reading module backend.
// VCCS has 4 sections with mixed column layouts:
//   - FRONT PANEL (dual_adaptive): hasil_a / hasil_b adapt per-row to nominal
//   - MSC & RCMS (dual_toggle_nf): hasil_a = Normal toggle, hasil_b = Fault toggle
//   - CWP (dual_toggle_nf): same as MSC & RCMS
//   - LINGKUNGAN KERJA (environment): hasil = single column

import type { ShiftType } from '@/types';

export type CnsdVccsMeterStatus = 'ongoing' | 'on_hold' | 'completed';
export type CnsdVccsMeterRoleKey = 'manager' | 'supervisor' | 'technician';

export interface CnsdVccsMeterSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdVccsMeterTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdVccsMeterItem {
  id: number;
  section_code: string | null;
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  item_number: string | null;
  item_name: string;
  nominal: string | null;
  hasil_a: string | null;
  hasil_b: string | null;
  hasil: string | null;
  keterangan: string | null;
  is_blocked: boolean;
  block_reason: string | null;
  sort_order: number;
}

export interface CnsdVccsMeterGroupMeta {
  number: number | null;
  name: string | null;
}

export type CnsdVccsInputsLayout =
  | 'dual_adaptive'
  | 'dual_toggle_nf'
  | 'environment';

export interface CnsdVccsMeterSectionMeta {
  code: string;
  name: string;
  inputs_layout: CnsdVccsInputsLayout;
  columns_label_1: string | null;
  columns_label_2: string | null;
  groups: CnsdVccsMeterGroupMeta[];
}

export interface CnsdVccsMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  day_name: string | null;
  time_filled: string | null;
  location: string;
  merk: string | null;
  type: string | null;
  serial_number: string | null;
  status: CnsdVccsMeterStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface CnsdVccsMeterRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  day_name: string | null;
  time_filled: string | null;
  location: string;
  merk: string | null;
  type: string | null;
  serial_number: string | null;
  status: CnsdVccsMeterStatus;
  manager: CnsdVccsMeterSignerInfo | null;
  supervisor: CnsdVccsMeterSignerInfo | null;
  technicians: CnsdVccsMeterTechnicianRow[];
  items: CnsdVccsMeterItem[];
  sections_meta: CnsdVccsMeterSectionMeta[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CnsdVccsMeterListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface CnsdVccsMeterUpdatePayload {
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  items?: Array<{
    id: number;
    hasil_a?: string | null;
    hasil_b?: string | null;
    hasil?: string | null;
    keterangan?: string | null;
  }>;
}
