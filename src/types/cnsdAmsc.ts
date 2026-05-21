// ─── CNSD AMSC Meter Reading — Form AMSC-METER ──────────────
//
// Type definitions for the CNSD AMSC Meter Reading module backend.
// AMSC has 4 sections with different column layouts:
//   - FRONT PANEL: hasil_a / hasil_b (dual A/B columns)
//   - POWER SUPPLY UNIT: hasil (single column)
//   - CHANNEL AMSC: address / status_value / cct / keterangan
//   - LINGKUNGAN KERJA: hasil (single column)

import type { ShiftType } from '@/types';

export type CnsdAmscMeterStatus = 'ongoing' | 'on_hold' | 'completed';
export type CnsdAmscMeterRoleKey = 'manager' | 'supervisor' | 'technician';

export interface CnsdAmscMeterSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdAmscMeterTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdAmscMeterItem {
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
  address: string | null;
  status_value: string | null;
  cct: string | null;
  keterangan: string | null;
  is_blocked: boolean;
  block_reason: string | null;
  sort_order: number;
}

export interface CnsdAmscMeterGroupMeta {
  number: number | null;
  name: string | null;
}

export interface CnsdAmscMeterSectionMeta {
  code: string;
  name: string;
  inputs_layout: 'dual_ab' | 'single_hasil' | 'channel' | 'environment';
  columns_label_1: string | null;
  columns_label_2: string | null;
  groups: CnsdAmscMeterGroupMeta[];
}

export interface CnsdAmscMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  day_name: string | null;
  time_filled: string | null;
  location: string;
  merk: string;
  type: string;
  serial_number: string | null;
  status: CnsdAmscMeterStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface CnsdAmscMeterRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  day_name: string | null;
  time_filled: string | null;
  location: string;
  merk: string;
  type: string;
  serial_number: string | null;
  status: CnsdAmscMeterStatus;
  manager: CnsdAmscMeterSignerInfo | null;
  supervisor: CnsdAmscMeterSignerInfo | null;
  technicians: CnsdAmscMeterTechnicianRow[];
  items: CnsdAmscMeterItem[];
  sections_meta: CnsdAmscMeterSectionMeta[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CnsdAmscMeterListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface CnsdAmscMeterUpdatePayload {
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  items?: Array<{
    id: number;
    hasil_a?: string | null;
    hasil_b?: string | null;
    hasil?: string | null;
    status_value?: string | null;
    cct?: string | null;
    keterangan?: string | null;
  }>;
}
