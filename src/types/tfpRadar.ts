import type { ShiftType } from '@/types';

export type TfpRadarStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpRadarRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpRadarSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpRadarTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpRadarItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  panel_rd01: string | null;
  panel_rd02: string | null;
  panel_cos_rd03_input: string | null;
  panel_cos_rd03_output: string | null;
  ups_topaz_input: string | null;
  ups_topaz_output: string | null;
  panel_rd04: string | null;
  panel_rd05: string | null;
  panel_rd06: string | null;
  panel_rd07: string | null;
  panel_rd08: string | null;
  is_disabled_map: Record<string, boolean> | null;
  sort_order: number;
}

export interface TfpRadarFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpRadarRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpRadarStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpRadarRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpRadarStatus;
  manager: TfpRadarSignerInfo | null;
  supervisor: TfpRadarSignerInfo | null;
  technicians: TfpRadarTechnicianRow[];
  items: TfpRadarItem[];
  facilities: TfpRadarFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpRadarListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpRadarUpdatePayload {
  items: Array<{
    id: number;
    panel_rd01?: string | null;
    panel_rd02?: string | null;
    panel_cos_rd03_input?: string | null;
    panel_cos_rd03_output?: string | null;
    ups_topaz_input?: string | null;
    ups_topaz_output?: string | null;
    panel_rd04?: string | null;
    panel_rd05?: string | null;
    panel_rd06?: string | null;
    panel_rd07?: string | null;
    panel_rd08?: string | null;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}
