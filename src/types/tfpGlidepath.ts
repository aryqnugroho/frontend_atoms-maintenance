import type { ShiftType } from '@/types';

export type TfpGlidepathStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpGlidepathRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpGlidepathSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpGlidepathTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpGlidepathItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  panel_gp01: string | null;
  is_disabled_map: Record<string, boolean> | null;
  sort_order: number;
}

export interface TfpGlidepathFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpGlidepathRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpGlidepathStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpGlidepathRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpGlidepathStatus;
  manager: TfpGlidepathSignerInfo | null;
  supervisor: TfpGlidepathSignerInfo | null;
  technicians: TfpGlidepathTechnicianRow[];
  items: TfpGlidepathItem[];
  facilities: TfpGlidepathFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpGlidepathListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpGlidepathUpdatePayload {
  items: Array<{ id: number; panel_gp01?: string | null }>;
  facilities?: Array<{ id: number; kondisi?: string | null; keterangan?: string | null }>;
}
