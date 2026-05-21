// ─── CNSD Recorder Meter Reading — Form RECORDER-METER (FORM C-3) ──
//
// Type definitions for the CNSD Recorder Meter Reading module backend.
// Mirrors the Radar Meter shape but with Recorder-specific item fields:
//   - hasil_server_a / hasil_server_b : section A (Peralatan) — Server A / B
//   - hasil                            : section B (Lingkungan Kerja) — single column
//   - is_blocked / block_reason        : U/S (Un-Serviceable) channel flag

import type { ShiftType } from '@/types';

export type CnsdRecorderMeterStatus = 'ongoing' | 'on_hold' | 'completed';
export type CnsdRecorderMeterRoleKey = 'manager' | 'supervisor' | 'technician';

export interface CnsdRecorderMeterSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdRecorderMeterTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdRecorderMeterItem {
  id: number;
  section_code: string | null;
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  item_number: string | null;
  item_name: string;
  nominal: string | null;
  hasil_server_a: string | null;
  hasil_server_b: string | null;
  hasil: string | null;
  keterangan: string | null;
  is_blocked: boolean;
  block_reason: string | null;
  sort_order: number;
}

export interface CnsdRecorderMeterGroupMeta {
  number: number | null;
  name: string | null;
}

export interface CnsdRecorderMeterSectionMeta {
  code: string;
  name: string;
  /** 'server_dual' renders Server A + Server B; 'environment' renders single HASIL column. */
  inputs_layout: 'server_dual' | 'environment';
  columns_label_1: string | null;
  columns_label_2: string | null;
  groups: CnsdRecorderMeterGroupMeta[];
}

export interface CnsdRecorderMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  location: string;
  form_code: string;
  merk: string;
  type: string;
  serial_number: string | null;
  status: CnsdRecorderMeterStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface CnsdRecorderMeterRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  location: string;
  form_code: string;
  merk: string;
  type: string;
  serial_number: string | null;
  status: CnsdRecorderMeterStatus;
  manager: CnsdRecorderMeterSignerInfo | null;
  supervisor: CnsdRecorderMeterSignerInfo | null;
  technicians: CnsdRecorderMeterTechnicianRow[];
  items: CnsdRecorderMeterItem[];
  sections_meta: CnsdRecorderMeterSectionMeta[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CnsdRecorderMeterListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface CnsdRecorderMeterUpdatePayload {
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  items?: Array<{
    id: number;
    hasil_server_a?: string | null;
    hasil_server_b?: string | null;
    hasil?: string | null;
    keterangan?: string | null;
  }>;
}
