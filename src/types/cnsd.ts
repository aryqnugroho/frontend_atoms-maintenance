// ─── CNSD Equipment Readiness — Form EQ-1 ─────────────────────
//
// Type definitions for the CNSD readiness module backend, which currently
// only supports the EQ-1 form. The shape is form-agnostic so future CNSD
// forms (Radar, Recorder, ...) can reuse the same client.

import type { ShiftType } from '@/types';

export type CnsdReadinessStatus = 'ongoing' | 'on_hold' | 'completed';
export type CnsdReadinessRoleKey = 'manager' | 'supervisor' | 'technician';

export interface CnsdReadinessSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdReadinessTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdReadinessItem {
  id: number;
  section_name: string;
  item_number: string | null;
  equipment_name: string;
  sub_equipment_name: string | null;
  status_peralatan: string | null;
  kondisi_operasional_1: string | null;
  kondisi_operasional_2: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface CnsdReadinessSectionMeta {
  name: string;
  columns_label_1: string | null;
  columns_label_2: string | null;
}

export interface CnsdReadinessRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  location: string;
  room: string | null;
  status: CnsdReadinessStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface CnsdReadinessRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  date: string;
  shift_type: ShiftType;
  location: string;
  room: string | null;
  status: CnsdReadinessStatus;
  manager: CnsdReadinessSignerInfo | null;
  supervisor: CnsdReadinessSignerInfo | null;
  technicians: CnsdReadinessTechnicianRow[];
  items: CnsdReadinessItem[];
  sections_meta: CnsdReadinessSectionMeta[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CnsdReadinessTemplateSection {
  name: string;
  columns_label_1: string;
  columns_label_2: string;
  items: Array<{
    item_number?: string;
    equipment_name: string;
    sub_equipment_name?: string;
    status_peralatan?: string;
    kondisi_operasional_1?: string;
    kondisi_operasional_2?: string;
    keterangan?: string;
  }>;
}

export interface CnsdReadinessListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface CnsdReadinessUpdatePayload {
  items: Array<{
    id: number;
    status_peralatan?: string | null;
    kondisi_operasional_1?: string | null;
    kondisi_operasional_2?: string | null;
    keterangan?: string | null;
  }>;
}

// Payload to add a new item row under a section (Manager/Supervisor only)
export interface CnsdReadinessAddItemPayload {
  section_name: string;
  item_number?: string | null;
  equipment_name: string;
  sub_equipment_name?: string | null;
  status_peralatan?: string | null;
  kondisi_operasional_1?: string | null;
  kondisi_operasional_2?: string | null;
  keterangan?: string | null;
}

// Structural edit (equipment name / numbering / sub-row label).
export interface CnsdReadinessUpdateItemStructurePayload {
  item_number?: string | null;
  equipment_name?: string | null;
  sub_equipment_name?: string | null;
}

// Rename a section heading + optionally its column labels.
export interface CnsdReadinessRenameSectionPayload {
  old_name: string;
  name: string;
  columns_label_1?: string | null;
  columns_label_2?: string | null;
}
