// ─── CNSD ATIS Meter Reading — Type Definitions ───────────────────────────────

export interface CnsdAtisMeterTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdAtisMeterItem {
  id: number;
  section_code: string;   // 'A' = TERMA RCM, 'B' = TERMA ATIS PLUS SYSTEM
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  item_name: string | null;
  nominal: string | null;
  reading: string | null;
  keterangan: string | null;
  is_header: boolean;
  sort_order: number;
}

export interface CnsdAtisMeterSignerInfo {
  id: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdAtisMeterRecordSummary {
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

export interface CnsdAtisMeterRecordDetail extends CnsdAtisMeterRecordSummary {
  manager: CnsdAtisMeterSignerInfo | null;
  supervisor: CnsdAtisMeterSignerInfo | null;
  technicians: CnsdAtisMeterTechnician[];
  items: CnsdAtisMeterItem[];
  sections_meta: Array<{
    code: string;
    name: string;
    inputs_layout: string;
    groups: Array<{ number: number | null; name: string | null }>;
  }>;
  created_by: { id: number; name: string } | null;
  updated_at: string;
}

export interface CnsdAtisMeterCreatePayload {
  date: string;
  shift_type: string;
  location?: string;
  merk?: string;
  type?: string;
  serial_number?: string;
}

export interface CnsdAtisMeterUpdatePayload {
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  items?: Array<{
    id: number;
    reading?: string | null;
    keterangan?: string | null;
  }>;
}

export interface CnsdAtisMeterSignPayload {
  role: 'manager' | 'supervisor' | 'technician';
  signature: string;
  technician_row_id?: number;
}
