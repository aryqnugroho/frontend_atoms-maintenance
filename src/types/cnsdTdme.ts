// ─── CNSD T-DME Meter Reading — Type Definitions ──────────────────────────────

export interface CnsdTdmeMeterTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdTdmeMeterItem {
  id: number;
  section_code: string;   // 'A' = PERALATAN, 'B' = LINGKUNGAN KERJA
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  item_name: string | null;
  nominal: string | null;
  hasil_layout: 'single' | 'dual';
  hasil_1: string | null;  // TX1/M1 or single result
  hasil_2: string | null;  // TX2/M2 (dual only)
  keterangan: string | null;
  is_header: boolean;
  sort_order: number;
}

export interface CnsdTdmeMeterSignerInfo {
  id: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdTdmeMeterRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  facility: string;
  form_code: string;
  merk: string | null;
  type: string | null;
  serial_number: string | null;
  tx1_mode: string | null;
  tx2_mode: string | null;
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

export interface CnsdTdmeMeterRecordDetail extends CnsdTdmeMeterRecordSummary {
  manager: CnsdTdmeMeterSignerInfo | null;
  supervisor: CnsdTdmeMeterSignerInfo | null;
  technicians: CnsdTdmeMeterTechnician[];
  items: CnsdTdmeMeterItem[];
  sections_meta: Array<{
    code: string;
    name: string;
    inputs_layout: string;
    groups: Array<{ number: number | null; name: string | null }>;
  }>;
  created_by: { id: number; name: string } | null;
  updated_at: string;
}

export interface CnsdTdmeMeterCreatePayload {
  date: string;
  shift_type: string;
  location?: string;
  merk?: string;
  type?: string;
  serial_number?: string;
  tx1_mode?: string;
  tx2_mode?: string;
}

export interface CnsdTdmeMeterUpdatePayload {
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  tx1_mode?: string | null;
  tx2_mode?: string | null;
  items?: Array<{
    id: number;
    hasil_1?: string | null;
    hasil_2?: string | null;
    keterangan?: string | null;
  }>;
}

export interface CnsdTdmeMeterSignPayload {
  role: 'manager' | 'supervisor' | 'technician';
  signature: string;
  technician_row_id?: number;
}
