// ─── Ground Check DVOR (Doppler VOR) Types ────────────────────

export interface GroundCheckDvorRecordSummary {
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

export interface GroundCheckDvorTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  technician_signature: string | null;
  technician_signed_at: string | null;
  sort_order: number;
}

export type GroundCheckDvorInputType =
  | 'numeric'
  | 'text'
  | 'header';

export interface GroundCheckDvorItem {
  id: number;
  section_name: string;
  subsection_name: string | null;
  item_code: string | null;
  parameter_name: string;
  input_type: GroundCheckDvorInputType;
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

export interface GroundCheckDvorBearingPoint {
  id: number;
  bearing: number; // 0, 15, 30, ..., 360
  tx1_reading: number | null;
  tx1_error: number | null;
  tx1_value: string | null;
  tx2_reading: number | null;
  tx2_error: number | null;
  tx2_value: string | null;
  sort_order: number;
}

export interface GroundCheckDvorNavItem {
  id: number;
  section_code: string | null;
  section_label: string | null;
  item_code: string | null;
  parameter_name: string;
  ref_tx1_value: string | null;
  ref_tx2_value: string | null;
  eq_tx1_value: string | null;
  eq_tx2_value: string | null;
  is_section_header: boolean;
  sort_order: number;
}

export interface GroundCheckDvorPhoto {
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

export interface GroundCheckDvorRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  report_month: string | null;
  airport: string;
  equipment_name: string;
  equipment_location: string;
  equipment_function: string | null;
  technical_data: string | null;
  identification: string | null;
  last_calibration: string | null;
  vor_equipment_name: string | null;
  vor_frequency: string | null;
  vor_station: string | null;
  curve_organization: string | null;
  nav_analyzer_title: string | null;
  note: string | null;
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
  technicians: GroundCheckDvorTechnician[];
  bearing_points: GroundCheckDvorBearingPoint[];
  items: GroundCheckDvorItem[];
  nav_items: GroundCheckDvorNavItem[];
  photos: GroundCheckDvorPhoto[];
  created_at: string | null;
  updated_at: string | null;
}

export interface GroundCheckDvorListResponse {
  success: boolean;
  data: GroundCheckDvorRecordSummary[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Compute the VOR Error from a manual Reading entry.
 *
 *   Error = bearing - reading_unwrapped
 *   Where reading_unwrapped = reading + 360 if (bearing > 180 && reading < 0), else reading.
 *
 * The instrument shows readings as signed angles in (-180°, +180°]. For bearings > 180°
 * the displayed reading wraps to negative. We undo that wrap before computing the error.
 *
 * Returns null when reading is null/undefined/NaN.
 */
export function computeDvorError(bearing: number, reading: number | null | undefined): number | null {
  if (reading === null || reading === undefined || Number.isNaN(reading)) return null;
  const unwrapped = bearing > 180 && reading < 0 ? reading + 360 : reading;
  return Number((bearing - unwrapped).toFixed(4));
}
