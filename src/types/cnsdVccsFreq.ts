// ─── CNSD VCCS Frequentis Meter Reading — Form VCCS-FREQ-METER ──
//
// Sister type-set to cnsdVccs.ts (VCCS LES, CNSD-014). Independent because
// each brand has its own table + service + endpoints, but the layouts shared
// with LES are intentionally kept consistent here.
//
// Layouts handled:
//   - FRONT PANEL (single_adaptive): single "Redundant Server" cell adapts per nominal
//   - MSC & RCMS / CWP (dual_toggle_nf): two √/- toggles labeled Normal | Fault
//   - LINGKUNGAN KERJA (environment): single result column

import type { ShiftType } from '@/types';

export type CnsdVccsFreqMeterStatus = 'ongoing' | 'on_hold' | 'completed';
export type CnsdVccsFreqMeterRoleKey = 'manager' | 'supervisor' | 'technician';

export interface CnsdVccsFreqMeterSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdVccsFreqMeterTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdVccsFreqMeterItem {
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

export interface CnsdVccsFreqMeterGroupMeta {
  number: number | null;
  name: string | null;
}

export type CnsdVccsFreqInputsLayout =
  | 'single_adaptive'
  | 'dual_toggle_nf'
  | 'environment';

export interface CnsdVccsFreqMeterSectionMeta {
  code: string;
  name: string;
  inputs_layout: CnsdVccsFreqInputsLayout;
  columns_label_1: string | null;
  columns_label_2: string | null;
  groups: CnsdVccsFreqMeterGroupMeta[];
}

export interface CnsdVccsFreqMeterRecordSummary {
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
  status: CnsdVccsFreqMeterStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface CnsdVccsFreqMeterRecordDetail {
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
  status: CnsdVccsFreqMeterStatus;
  manager: CnsdVccsFreqMeterSignerInfo | null;
  supervisor: CnsdVccsFreqMeterSignerInfo | null;
  technicians: CnsdVccsFreqMeterTechnicianRow[];
  items: CnsdVccsFreqMeterItem[];
  sections_meta: CnsdVccsFreqMeterSectionMeta[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CnsdVccsFreqMeterListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface CnsdVccsFreqMeterUpdatePayload {
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
