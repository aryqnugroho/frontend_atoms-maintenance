/**
 * Type definitions for CNSD Transmitter Meter Reading module.
 */

export interface CnsdTransmitterMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  form_code: string;
  date: string;
  shift_type: string;
  day_name: string | null;
  time_filled: string | null;
  location: string;
  status: 'ongoing' | 'on_hold' | 'completed';
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at: string;
}

export interface CnsdTransmitterMeterTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdTransmitterMeterItem {
  id: number;
  section_code: string | null;
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  frequency_label: string | null;
  merk: string | null;
  tx_label: string | null;
  status_value: string | null;
  power_output: string | null;
  modulasi: string | null;
  keterangan: string | null;
  nominal: string | null;
  hasil: string | null;
  is_header: boolean;
  is_blocked: boolean;
  block_reason: string | null;
  sort_order: number;
}

export interface CnsdTransmitterMeterRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  form_code: string;
  date: string;
  shift_type: string;
  day_name: string | null;
  time_filled: string | null;
  location: string;
  status: 'ongoing' | 'on_hold' | 'completed';
  manager: {
    id: number | null;
    name: string;
    signature: string | null;
    signed_by: number | null;
    signed_at: string | null;
  } | null;
  supervisor: {
    id: number | null;
    name: string;
    signature: string | null;
    signed_by: number | null;
    signed_at: string | null;
  } | null;
  technicians: CnsdTransmitterMeterTechnician[];
  items: CnsdTransmitterMeterItem[];
  sections_meta: CnsdTransmitterSectionMeta[];
  created_by: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CnsdTransmitterSectionMeta {
  code: string;
  name: string;
  inputs_layout: string;
  groups: { number: number | null; name: string | null }[];
}
