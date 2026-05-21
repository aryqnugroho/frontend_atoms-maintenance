// ─── CNSD DVOR Meter Reading — Type Definitions ───────────────────────────────

export interface CnsdDvorMeterTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdDvorMeterItem {
  id: number;
  section_code: string;   // 'I' = PERALATAN, 'II' = LINGKUNGAN KERJA
  section_name: string;
  group_code: string | null;   // A, B, C, D, E, F, G, ENV
  group_name: string | null;
  item_name: string | null;
  limit_value: string | null;  // DVOR uses 'limit' not 'nominal'
  hasil_pemeriksaan: string | null;  // single result column
  keterangan: string | null;
  is_header: boolean;
  sort_order: number;
}

export interface CnsdDvorMeterSignerInfo {
  id: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdDvorMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  form_code: string;
  merk: string | null;
  type: string | null;
  serial_number: string | null;
  tx1_mode: string | null;  // MAIN or STANDBY
  tx2_mode: string | null;  // MAIN or STANDBY
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

export interface CnsdDvorMeterRecordDetail extends CnsdDvorMeterRecordSummary {
  manager: CnsdDvorMeterSignerInfo | null;
  supervisor: CnsdDvorMeterSignerInfo | null;
  technicians: CnsdDvorMeterTechnician[];
  items: CnsdDvorMeterItem[];
  sections_meta: Array<{
    code: string;
    name: string;
    inputs_layout: string;
    groups: Array<{ code: string | null; name: string | null }>;
  }>;
  created_by: { id: number; name: string } | null;
  updated_at: string;
}

export interface CnsdDvorMeterCreatePayload {
  date: string;
  shift_type: string;
  location?: string;
  merk?: string;
  type?: string;
  serial_number?: string;
  tx1_mode?: 'MAIN' | 'STANDBY';
  tx2_mode?: 'MAIN' | 'STANDBY';
}

export interface CnsdDvorMeterUpdatePayload {
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  tx1_mode?: 'MAIN' | 'STANDBY' | null;
  tx2_mode?: 'MAIN' | 'STANDBY' | null;
  items?: Array<{
    id: number;
    hasil_pemeriksaan?: string | null;
    keterangan?: string | null;
  }>;
}

export interface CnsdDvorMeterSignPayload {
  role: 'manager' | 'supervisor' | 'technician';
  signature: string;
  technician_row_id?: number;
}
