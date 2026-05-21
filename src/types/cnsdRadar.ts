// ─── CNSD Radar Meter Reading — Form RADAR-METER ──────────────
//
// Type definitions for the CNSD Radar Meter Reading module backend.
// Mirrors the EQ-1 readiness shape but with Radar-specific item fields:
//   - kondisi_teknis_tx1 / tx2 : technical readings for section A (LCMS)
//   - hasil                    : single result column for section C (environment)
//   - standard                 : seeded threshold value (e.g. ">2500 W", "Green")

import type { ShiftType } from '@/types';

export type CnsdRadarMeterStatus = 'ongoing' | 'on_hold' | 'completed';
export type CnsdRadarMeterRoleKey = 'manager' | 'supervisor' | 'technician';

export interface CnsdRadarMeterSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdRadarMeterTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdRadarMeterItem {
  id: number;
  section_code: string | null;
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  item_number: string | null;
  item_name: string;
  standard: string | null;
  kondisi_teknis_tx1: string | null;
  kondisi_teknis_tx2: string | null;
  hasil: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface CnsdRadarMeterGroupMeta {
  number: number | null;
  name: string | null;
}

export interface CnsdRadarMeterSectionMeta {
  code: string;
  name: string;
  /** 'tx_dual' renders TX I + TX II; 'environment' renders single HASIL column. */
  inputs_layout: 'tx_dual' | 'environment';
  columns_label_1: string | null;
  columns_label_2: string | null;
  groups: CnsdRadarMeterGroupMeta[];
}

export interface CnsdRadarMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  location: string;
  merk: string;
  type: string;
  serial_number: string | null;
  status: CnsdRadarMeterStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface CnsdRadarMeterRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  location: string;
  merk: string;
  type: string;
  serial_number: string | null;
  status: CnsdRadarMeterStatus;
  manager: CnsdRadarMeterSignerInfo | null;
  supervisor: CnsdRadarMeterSignerInfo | null;
  technicians: CnsdRadarMeterTechnicianRow[];
  items: CnsdRadarMeterItem[];
  sections_meta: CnsdRadarMeterSectionMeta[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CnsdRadarMeterListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface CnsdRadarMeterUpdatePayload {
  // Equipment metadata (paper-form header). Editable by Manager / Supervisor.
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  items: Array<{
    id: number;
    kondisi_teknis_tx1?: string | null;
    kondisi_teknis_tx2?: string | null;
    hasil?: string | null;
    keterangan?: string | null;
  }>;
}
