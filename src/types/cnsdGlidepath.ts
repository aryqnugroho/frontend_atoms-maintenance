// ─── CNSD Glide Path Meter Reading — Type Definitions ─────────────────────────

export interface CnsdGlidepathMeterTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdGlidepathMeterItem {
  id: number;
  section_code: string;   // 'A' = METER READING, 'B' = LINGKUNGAN KERJA
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  item_name: string | null;
  nominal: string | null;
  hasil_layout: 'single' | 'dual'; // 'single' = one result col, 'dual' = M1/M2 or TX1/TX2
  hasil_1: string | null;  // single result or TX1/M1
  hasil_2: string | null;  // TX2/M2 (dual only)
  keterangan: string | null;
  is_header: boolean;
  sort_order: number;
}

export interface CnsdGlidepathMeterSignerInfo {
  id: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdGlidepathMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  form_code: string;
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

export interface CnsdGlidepathMeterRecordDetail extends CnsdGlidepathMeterRecordSummary {
  manager: CnsdGlidepathMeterSignerInfo | null;
  supervisor: CnsdGlidepathMeterSignerInfo | null;
  technicians: CnsdGlidepathMeterTechnician[];
  items: CnsdGlidepathMeterItem[];
  sections_meta: Array<{
    code: string;
    name: string;
    inputs_layout: string;
    groups: Array<{ number: number | null; name: string | null }>;
  }>;
  created_by: { id: number; name: string } | null;
  updated_at: string;
}

export interface CnsdGlidepathMeterCreatePayload {
  date: string;
  shift_type: string;
  location?: string;
  merk?: string;
  type?: string;
  serial_number?: string;
}

export interface CnsdGlidepathMeterUpdatePayload {
  items: Array<{
    id: number;
    hasil_1?: string | null;
    hasil_2?: string | null;
    keterangan?: string | null;
  }>;
}

export interface CnsdGlidepathMeterSignPayload {
  role: 'manager' | 'supervisor' | 'technician';
  signature: string;
  technician_row_id?: number;
}
