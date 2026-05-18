import type { ShiftType } from '@/types';

export type TfpTransmitterTxStatus  = 'ongoing' | 'on_hold' | 'completed';
export type TfpTransmitterTxRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpTransmitterTxSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpTransmitterTxTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpTransmitterTxItem {
  id: number;
  parameter_number: string | null;
  parameter_name: string;
  unit: string | null;
  panel_tx01: string | null;
  panel_tx02: string | null;
  panel_cos_tx03_input: string | null;
  panel_cos_tx03_output: string | null;
  panel_output_ups_tx04: string | null;
  panel_ups_tx07_input: string | null;
  panel_ups_tx07_output: string | null;
  panel_ac_tx06: string | null;
  ups_piller_input: string | null;
  ups_piller_output: string | null;
  panel_milat_ru11: string | null;
  is_disabled_map: Record<string, boolean> | null;
  sort_order: number;
}

export interface TfpTransmitterTxFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpTransmitterTxRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpTransmitterTxStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpTransmitterTxRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpTransmitterTxStatus;
  manager: TfpTransmitterTxSignerInfo | null;
  supervisor: TfpTransmitterTxSignerInfo | null;
  technicians: TfpTransmitterTxTechnicianRow[];
  items: TfpTransmitterTxItem[];
  facilities: TfpTransmitterTxFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpTransmitterTxListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpTransmitterTxUpdatePayload {
  items: Array<{
    id: number;
    panel_tx01?: string | null;
    panel_tx02?: string | null;
    panel_cos_tx03_input?: string | null;
    panel_cos_tx03_output?: string | null;
    panel_output_ups_tx04?: string | null;
    panel_ups_tx07_input?: string | null;
    panel_ups_tx07_output?: string | null;
    panel_ac_tx06?: string | null;
    ups_piller_input?: string | null;
    ups_piller_output?: string | null;
    panel_milat_ru11?: string | null;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}
