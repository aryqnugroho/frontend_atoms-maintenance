// ─── Ground Check LLZ Types ────────────────────────────────────

export interface GroundCheckLlzRecordSummary {
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

export interface GroundCheckLlzTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  technician_signature: string | null;
  technician_signed_at: string | null;
  sort_order: number;
}

export type GroundCheckLlzInputType =
  | 'numeric'
  | 'text'
  | 'header';

export interface GroundCheckLlzItem {
  id: number;
  section_name: string;
  subsection_name: string | null;
  item_code: string | null;
  parameter_name: string;
  input_type: GroundCheckLlzInputType;
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
  sort_order: number;
}

export type LlzCurveSide = '90hz' | 'center' | '150hz';

export interface GroundCheckLlzCurvePoint {
  id: number;
  side: LlzCurveSide;
  jarak_m: number;
  degrees: number;
  tx1_ddm_pct: number | null;
  tx1_ddm_ua: number | null;
  tx1_sum_pct: number | null;
  tx1_mod_90hz: number | null;
  tx1_mod_150hz: number | null;
  tx1_rf_level_db: number | null;
  tx2_ddm_pct: number | null;
  tx2_ddm_ua: number | null;
  tx2_sum_pct: number | null;
  tx2_mod_90hz: number | null;
  tx2_mod_150hz: number | null;
  tx2_rf_level_db: number | null;
  sort_order: number;
}

export interface GroundCheckLlzPhoto {
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

export interface GroundCheckLlzRecordDetail {
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
  curve_facility: string | null;
  curve_merk: string | null;
  curve_ident_freq: string | null;
  curve_jarak_ant: string | null;
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
  technicians: GroundCheckLlzTechnician[];
  items: GroundCheckLlzItem[];
  curve_points: GroundCheckLlzCurvePoint[];
  photos: GroundCheckLlzPhoto[];
  created_at: string | null;
  updated_at: string | null;
}

export interface GroundCheckLlzListResponse {
  success: boolean;
  data: GroundCheckLlzRecordSummary[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Convert a curve point's (side, degrees) to the signed X-coordinate used on the
 * Ground Performance Curve chart:
 *   '90hz'   → -degrees
 *   'center' → 0
 *   '150hz'  → +degrees
 */
export function signedDegrees(point: Pick<GroundCheckLlzCurvePoint, 'side' | 'degrees'>): number {
  if (point.side === '90hz') return -point.degrees;
  if (point.side === '150hz') return point.degrees;
  return 0;
}
