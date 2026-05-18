import type { ShiftType } from '@/types';

export type TfpTowerStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpTowerRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpTowerSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpTowerTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpTowerItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  panel_a10: string | null;
  panel_a11: string | null;
  panel_ats_a13_input: string | null;
  panel_ats_a13_output: string | null;
  panel_a14: string | null;
  panel_a16: string | null;
  panel_a17: string | null;
  panel_a18: string | null;
  panel_a19: string | null;
  panel_a20: string | null;
  panel_milat_ru1213: string | null;
  is_disabled_map: Record<string, boolean> | null;
  sort_order: number;
}

export interface TfpTowerFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpTowerRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpTowerStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpTowerRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpTowerStatus;
  manager: TfpTowerSignerInfo | null;
  supervisor: TfpTowerSignerInfo | null;
  technicians: TfpTowerTechnicianRow[];
  items: TfpTowerItem[];
  facilities: TfpTowerFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpTowerListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpTowerUpdatePayload {
  items: Array<{
    id: number;
    panel_a10?: string | null;
    panel_a11?: string | null;
    panel_ats_a13_input?: string | null;
    panel_ats_a13_output?: string | null;
    panel_a14?: string | null;
    panel_a16?: string | null;
    panel_a17?: string | null;
    panel_a18?: string | null;
    panel_a19?: string | null;
    panel_a20?: string | null;
    panel_milat_ru1213?: string | null;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}
