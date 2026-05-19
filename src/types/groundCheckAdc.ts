// ─── Ground Check ADC Types ────────────────────────────────────

export interface GroundCheckAdcRecordSummary {
  id: number;
  form_number: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: string;
  status: 'ongoing' | 'on_hold' | 'completed';
  report_month: string | null;
  airport: string;
  equipment_name: string;
  manager_name: string | null;
  manager_signature: boolean;
  supervisor_name: string | null;
  supervisor_signature: boolean;
  technicians_count: number;
  technician_names: string[];
  created_at: string | null;
}

export interface GroundCheckAdcTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  technician_signature: string | null;
  technician_signed_at: string | null;
  sort_order: number;
}

export type GroundCheckAdcInputType =
  | 'numeric'
  | 'dropdown_function'
  | 'dropdown_quality'
  | 'dropdown_clarity'
  | 'text'
  | 'header';

export interface GroundCheckAdcItem {
  id: number;
  section_name: string;
  item_code: string | null;
  parameter_name: string;
  input_type: GroundCheckAdcInputType;
  calibration_result: string | null;
  tolerance: string | null;
  tx1_hasil_pd: string | null;
  tx1_in_tolerance: string | null;
  tx1_out_of_tolerance: string | null;
  tx2_hasil_pd: string | null;
  tx2_in_tolerance: string | null;
  tx2_out_of_tolerance: string | null;
  keterangan: string | null;
  is_header: boolean;
  sort_order: number;
}

export interface GroundCheckAdcPhoto {
  id: number;
  url: string | null;
  caption: string | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number;
  uploaded_by_id: number | null;
  uploaded_by_name: string | null;
  sort_order: number;
  uploaded_at: string | null;
}

export interface GroundCheckAdcRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  report_month: string | null;
  airport: string;
  equipment_name: string;
  equipment_location: string;
  equipment_function: string | null;
  technical_data: string | null;
  last_calibration: string | null;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: string;
  status: 'ongoing' | 'on_hold' | 'completed';
  manager_id: number | null;
  manager_name: string | null;
  manager_signature: string | null;
  manager_signed_at: string | null;
  supervisor_id: number | null;
  supervisor_name: string | null;
  supervisor_signature: string | null;
  supervisor_signed_at: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  technicians: GroundCheckAdcTechnician[];
  items: GroundCheckAdcItem[];
  photos: GroundCheckAdcPhoto[];
  created_at: string | null;
  updated_at: string | null;
}

export interface GroundCheckAdcListResponse {
  success: boolean;
  data: GroundCheckAdcRecordSummary[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
