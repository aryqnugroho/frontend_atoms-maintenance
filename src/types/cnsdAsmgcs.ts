// ─── CNSD ASMGCS Meter Reading — Form ASMGCS-METER (SAAB) ──────
//
// Sister type-set to cnsdVccsFreq.ts (CNSD-015). Independent because each
// equipment has its own table + service + endpoints. Layouts shared:
//   - FRONT PANEL (single_adaptive): single "Redundant Server" cell adapts per nominal
//   - CENTRAL SERVER (dual_toggle_nf): two √/- toggles labeled Normal | Fault
//   - LINGKUNGAN KERJA (environment): single result column

import type { ShiftType } from '@/types';

export type CnsdAsmgcsMeterStatus = 'ongoing' | 'on_hold' | 'completed';
export type CnsdAsmgcsMeterRoleKey = 'manager' | 'supervisor' | 'technician';

export interface CnsdAsmgcsMeterSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdAsmgcsMeterTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdAsmgcsMeterItem {
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

export interface CnsdAsmgcsMeterGroupMeta {
  number: number | null;
  name: string | null;
}

export type CnsdAsmgcsInputsLayout =
  | 'single_adaptive'
  | 'dual_toggle_nf'
  | 'environment';

export interface CnsdAsmgcsMeterSectionMeta {
  code: string;
  name: string;
  inputs_layout: CnsdAsmgcsInputsLayout;
  columns_label_1: string | null;
  columns_label_2: string | null;
  groups: CnsdAsmgcsMeterGroupMeta[];
}

export interface CnsdAsmgcsMeterRecordSummary {
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
  status: CnsdAsmgcsMeterStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface CnsdAsmgcsMeterRecordDetail {
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
  status: CnsdAsmgcsMeterStatus;
  manager: CnsdAsmgcsMeterSignerInfo | null;
  supervisor: CnsdAsmgcsMeterSignerInfo | null;
  technicians: CnsdAsmgcsMeterTechnicianRow[];
  items: CnsdAsmgcsMeterItem[];
  sections_meta: CnsdAsmgcsMeterSectionMeta[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CnsdAsmgcsMeterListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface CnsdAsmgcsMeterUpdatePayload {
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
