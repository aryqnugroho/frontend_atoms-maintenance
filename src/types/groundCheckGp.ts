// ─── Ground Check GP (Glide Path) Types ────────────────────────

export interface GroundCheckGpRecordSummary {
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

export interface GroundCheckGpTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  technician_signature: string | null;
  technician_signed_at: string | null;
  sort_order: number;
}

export type GroundCheckGpInputType =
  | 'numeric'
  | 'text'
  | 'header';

export interface GroundCheckGpItem {
  id: number;
  section_name: string;
  subsection_name: string | null;
  item_code: string | null;
  parameter_name: string;
  input_type: GroundCheckGpInputType;
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
  is_subheader: boolean;
  is_disabled: boolean;
  is_check_only: boolean;
  sort_order: number;
}

export interface GroundCheckGpNavItem {
  id: number;
  section_code: string | null;
  section_label: string | null;
  section_keterangan: string | null;
  item_code: string | null;
  parameter_name: string;
  tx1_value: string | null;
  tx2_value: string | null;
  keterangan: string | null;
  is_section_header: boolean;
  sort_order: number;
}

export interface GroundCheckGpPhoto {
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

export interface GroundCheckGpRecordDetail {
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
  nav_organization: string | null;
  nav_analyzer_title: string | null;
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
  technicians: GroundCheckGpTechnician[];
  items: GroundCheckGpItem[];
  nav_items: GroundCheckGpNavItem[];
  photos: GroundCheckGpPhoto[];
  created_at: string | null;
  updated_at: string | null;
}

export interface GroundCheckGpListResponse {
  success: boolean;
  data: GroundCheckGpRecordSummary[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
