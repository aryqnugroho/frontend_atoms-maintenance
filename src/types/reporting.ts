/**
 * Type definitions for Reporting / Damage Report module.
 *
 * Reporting differs from Work Order, CNSD, TFP, Grounding — it does NOT
 * use the rostering shift personnel automatically. Manager Teknik dan
 * Pelaksana Perbaikan dipilih manual oleh user dari personel database.
 */

export type DamageCategory = '1' | '2' | '3';
export type RepairByType = 'lokasi' | 'pusat';
export type ReportingStatus = 'ongoing' | 'on_hold' | 'completed';
export type ObstacleCode =
  | 'AU' | 'PK' | 'TT' | 'SC' | 'TR' | 'ST' | 'PC' | 'AL' | 'TH';

export const OBSTACLE_CODE_LABELS: Record<ObstacleCode, string> = {
  AU: 'Tidak ada alat ukur',
  PK: 'Menunggu Penerbangan Kalibrasi',
  TT: 'Tidak ada teknisi',
  SC: 'Menunggu Suku Cadang',
  TR: 'Tidak Ada Transportasi',
  ST: 'Peralatan Belum Ada Serah Terima',
  PC: 'Pengaruh Cuaca',
  AL: 'Alasan Lain',
  TH: 'Tidak ada hambatan',
};

export const OBSTACLE_CODE_ORDER: ObstacleCode[] = [
  'AU', 'PK', 'TT', 'SC', 'TR', 'ST', 'PC', 'AL', 'TH',
];

export const DAMAGE_CATEGORY_LABELS: Record<DamageCategory, string> = {
  '1': 'Ringan',
  '2': 'Sedang',
  '3': 'Berat',
};

export const DAMAGE_CATEGORY_ORDER: DamageCategory[] = ['1', '2', '3'];

export const normalizeDamageCategory = (value: string | null | undefined): DamageCategory => {
  if (value === '1' || value === '2' || value === '3') return value;
  if (value === 'Ringan') return '1';
  if (value === 'Sedang') return '2';
  if (value === 'Berat') return '3';
  return '1';
};

export interface ReportingPerson {
  id: number;
  name: string;
  email: string | null;
  role: string;
  division: string | null;
}

export interface ReportingDamageRepairer {
  /** id is null for new (unsaved) rows in form state */
  id: number | null;
  person_id: number | null;
  person_name: string;
  person_role: string | null;
  person_division: string | null;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface ReportingDamageReportSummary {
  id: number;
  report_number: string;
  report_date: string;
  day_name: string | null;
  location: string;
  facility: string;
  equipment_name: string;
  equipment_module: string | null;
  damage_category: DamageCategory;
  obstacle_code: ObstacleCode | null;
  status: ReportingStatus;
  manager_name: string | null;
  repairers_count: number;
  repairer_names: string[];
  created_at: string;
}

export interface ReportingDamageReportDetail {
  id: number;
  report_number: string;
  report_date: string;
  day_name: string | null;
  location: string;
  facility: string;
  equipment_name: string;
  equipment_module: string | null;
  damage_category: DamageCategory;
  damage_description: string;
  damage_cause: string | null;
  repair_action: string | null;
  repair_by_type: RepairByType | null;
  damage_started_at: string | null;
  repair_finished_at: string | null;
  downtime_hours: number | null;
  obstacle_code: ObstacleCode | null;
  obstacle_description: string | null;
  status: ReportingStatus;
  manager: {
    id: number | null;
    name: string;
    role: string | null;
    signature: string | null;
    signed_by: number | null;
    signed_at: string | null;
  } | null;
  repairers: ReportingDamageRepairer[];
  created_by: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReportingDamageReportPayload {
  report_date: string;
  location: string;
  facility: string;
  equipment_name: string;
  equipment_module?: string | null;
  damage_category: DamageCategory;
  damage_description: string;
  damage_cause?: string | null;
  repair_action?: string | null;
  repair_by_type?: RepairByType | null;
  damage_started_at?: string | null;
  repair_finished_at?: string | null;
  downtime_hours?: number | null;
  obstacle_code?: ObstacleCode | null;
  obstacle_description?: string | null;
  manager_id: number;
  repairers: Array<{
    person_id?: number | null;
    person_name: string;
    person_role?: string | null;
    person_division?: string | null;
  }>;
}

export interface UpdateReportingDamageReportPayload {
  location?: string;
  facility?: string;
  equipment_name?: string;
  equipment_module?: string | null;
  damage_category?: DamageCategory;
  damage_description?: string;
  damage_cause?: string | null;
  repair_action?: string | null;
  repair_by_type?: RepairByType | null;
  damage_started_at?: string | null;
  repair_finished_at?: string | null;
  downtime_hours?: number | null;
  obstacle_code?: ObstacleCode | null;
  obstacle_description?: string | null;
  manager_id?: number;
  repairers?: Array<{
    id?: number | null;
    person_id?: number | null;
    person_name: string;
    person_role?: string | null;
    person_division?: string | null;
  }>;
}

export type ReportingSignRole = 'manager' | 'repairer';
