// ─── CNSD ATC SYSTEM Meter Reading — Type Definitions ────────────────────────

export interface CnsdAtcSystemMeterTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdAtcSystemMeterItem {
  id: number;
  section_code: string;          // 'A'..'L'
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  item_name: string | null;
  sub_item_label: string | null;
  nominal: string | null;
  value_1: string | null;
  value_2: string | null;
  value_3: string | null;
  value_4: string | null;
  status_flags: string | null;   // comma-separated multi-select (e.g. "C,M,F")
  keterangan: string | null;
  is_header: boolean;
  sort_order: number;
}

export interface CnsdAtcSystemMeterSignerInfo {
  id: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdAtcSystemMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  form_code: string | null;
  merk: string | null;
  type: string | null;
  serial_number: string | null;
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

export interface CnsdAtcSystemMeterRecordDetail extends CnsdAtcSystemMeterRecordSummary {
  manager: CnsdAtcSystemMeterSignerInfo | null;
  supervisor: CnsdAtcSystemMeterSignerInfo | null;
  technicians: CnsdAtcSystemMeterTechnician[];
  items: CnsdAtcSystemMeterItem[];
  sections_meta: Array<{
    code: string;
    name: string;
    inputs_layout: string;
    groups: Array<{ number: number | null; name: string | null }>;
  }>;
  created_by: { id: number; name: string } | null;
  updated_at: string;
}

export interface CnsdAtcSystemMeterCreatePayload {
  date: string;
  shift_type: string;
  location?: string;
  merk?: string;
  type?: string;
  serial_number?: string;
}

export interface CnsdAtcSystemMeterUpdatePayload {
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  items?: Array<{
    id: number;
    value_1?: string | null;
    value_2?: string | null;
    value_3?: string | null;
    value_4?: string | null;
    status_flags?: string | null;
    keterangan?: string | null;
  }>;
}

export interface CnsdAtcSystemMeterSignPayload {
  role: 'manager' | 'supervisor' | 'technician';
  signature: string;
  technician_row_id?: number;
}
