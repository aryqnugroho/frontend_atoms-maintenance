// ─── CNSD Receiver Meter Reading — Type Definitions ───────────────────────────

export interface CnsdReceiverMeterTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface CnsdReceiverMeterItem {
  id: number;
  section_code: string;   // '1' = RECEIVER, '2' = LINGKUNGAN KERJA
  section_name: string;
  group_number: number | null;
  group_name: string | null;
  item_name: string | null;
  // Section 1 fields
  status_a: string | null;    // ON LINE / OFF LINE
  status_b: string | null;    // ON LINE / OFF LINE
  sequelsh_on: string | null; // free text
  keterangan: string | null;
  // Section 2 fields
  nominal: string | null;
  hasil: string | null;
  // Flags
  is_header: boolean;
  sort_order: number;
}

export interface CnsdReceiverMeterSignerInfo {
  id: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface CnsdReceiverMeterRecordSummary {
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

export interface CnsdReceiverMeterRecordDetail extends CnsdReceiverMeterRecordSummary {
  manager: CnsdReceiverMeterSignerInfo | null;
  supervisor: CnsdReceiverMeterSignerInfo | null;
  technicians: CnsdReceiverMeterTechnician[];
  items: CnsdReceiverMeterItem[];
  sections_meta: Array<{
    code: string;
    name: string;
    inputs_layout: string;
    groups: Array<{ number: number | null; name: string | null }>;
  }>;
  created_by: { id: number; name: string } | null;
  updated_at: string;
}

export interface CnsdReceiverMeterCreatePayload {
  date: string;
  shift_type: string;
  location?: string;
  merk?: string;
  type?: string;
  serial_number?: string;
}

export interface CnsdReceiverMeterUpdatePayload {
  merk?: string | null;
  type?: string | null;
  serial_number?: string | null;
  items?: Array<{
    id: number;
    status_a?: string | null;
    status_b?: string | null;
    sequelsh_on?: string | null;
    keterangan?: string | null;
    hasil?: string | null;
  }>;
}

export interface CnsdReceiverMeterSignPayload {
  role: 'manager' | 'supervisor' | 'technician';
  signature: string;
  technician_row_id?: number;
}
