/**
 * Type definitions for Grounding Report module.
 */

export interface GroundingReportSummary {
  id: number;
  report_number: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: string;
  work_unit: string;
  equipment_name: string;
  equipment_location: string;
  status: 'ongoing' | 'on_hold' | 'completed';
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at: string;
}

export interface GroundingReportTechnician {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface GroundingReportItem {
  id: number;
  section_name: string; // 'VISUAL' | 'PENGUKURAN'
  item_number: number;
  item_name: string;
  standard: string | null;
  availability: string | null; // Ada | Tidak Ada (VISUAL only)
  condition: string | null;    // Baik | Tidak Baik
  notes: string | null;
  sort_order: number;
}

export interface GroundingReportDetail {
  id: number;
  report_number: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: string;
  work_unit: string;
  equipment_name: string;
  equipment_location: string;
  status: 'ongoing' | 'on_hold' | 'completed';
  manager: {
    id: number | null;
    name: string;
    signature: string | null;
    signed_by: number | null;
    signed_at: string | null;
  } | null;
  supervisor: {
    id: number | null;
    name: string;
    signature: string | null;
    signed_by: number | null;
    signed_at: string | null;
  } | null;
  technicians: GroundingReportTechnician[];
  items: GroundingReportItem[];
  sections_meta: { name: string; count: number }[];
  created_by: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}
