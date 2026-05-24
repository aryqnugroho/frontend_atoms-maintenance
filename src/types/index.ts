// ─── Auth & User ───────────────────────────────────────────
export type UserRole =
  | 'Admin'
  | 'General Manager'
  | 'Manager Teknik'
  | 'Supervisor CNSD'
  | 'Supervisor TFP'
  | 'Teknisi CNSD'
  | 'Teknisi TFP';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employee_id?: string;
  signature_url?: string;
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Notification ──────────────────────────────────────────
/**
 * Persisted in-app notification. id is Laravel's UUID (string) for real
 * notifications and number for legacy mock data — keep the union to avoid
 * churning every consumer.
 *
 * `data` holds the raw payload from the backend (wo_id, role, etc.) and is
 * used by consumers to deep-link to the right page when a user clicks.
 */
export interface NotificationData {
  type?: string;
  title?: string;
  message?: string;
  wo_id?: number;
  wo_number?: string;
  role?: string;
  shift_type?: ShiftType;
  shift_date?: string;
  changed_fields?: string[];
  old_status?: WOStatus;
  new_status?: WOStatus;
  [key: string]: unknown;
}

export interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: NotificationData;
}

// ─── Shift Schedule ────────────────────────────────────────
export type ShiftType = 'pagi' | 'siang' | 'malam';

export interface ShiftPersonnel {
  id: number;
  name: string;
  role: UserRole;
  division: 'CNSD' | 'TFP' | 'Management';
}

export interface ShiftScheduleResponse {
  current_shift: ShiftType;
  shift_start: string;
  shift_end: string;
  date: string;
  personnel: ShiftPersonnel[];
}

/**
 * Response from GET /api/v1/personnel/shift-today
 * Real shift context sourced from atoms-rostering (read-only DB).
 * Used by Work Order creation to auto-populate MT, supervisor, and personnel.
 */
export interface RosteringShiftPersonnel {
  user_id: number;       // rostering users.id (maps to local_users.rostering_user_id)
  name: string;
  role: string;          // rostering role: 'Cns' | 'Support' | 'Manager Teknik' | etc.
  grade?: number | null;
  employee_type: string; // 'CNS' | 'Support' | 'Manager Teknik'
  group_number?: number | null;
}

export interface RosteringShiftTimes {
  start_time: string;    // e.g. "07:00:00"
  end_time: string;      // e.g. "13:00:00"
}

export interface RosteringShiftManager {
  user_id: number;
  name: string;
  role: string;
  employee_type: string;
}

export interface RosteringShiftSupervisor {
  user_id: number;
  name: string;
  role: string;
  grade: number;
}

/**
 * Full shift context from atoms-rostering.
 * roster_available = false means no published roster for this date/shift.
 * When false, fall back to manual selection from local_users.
 */
export interface ShiftContextResponse {
  date: string;
  shift_type: ShiftType;
  shift_times: RosteringShiftTimes | null;
  has_supervisor: boolean;
  roster_available: boolean;
  manager: RosteringShiftManager | null;
  /** Primary supervisor: CNSD preferred, falls back to TFP. Kept for compatibility. */
  supervisor: RosteringShiftSupervisor | null;
  /** CNSD supervisor (CNS employee with grade ≥ 13) on this shift. */
  supervisor_cnsd: RosteringShiftSupervisor | null;
  /** TFP supervisor (Support employee with grade ≥ 13) on this shift. */
  supervisor_tfp: RosteringShiftSupervisor | null;
  personnel: RosteringShiftPersonnel[];
}

// ─── Dashboard ─────────────────────────────────────────────
export interface DashboardChecklistItem {
  id: string;
  label: string;
  division: 'CNSD' | 'TFP';
  is_active: boolean;       // aktif di MVP atau coming soon
  is_completed: boolean;    // sudah selesai di shift ini
  route?: string;           // link ke form jika aktif
}

export interface TroubleEquipment {
  id: number;
  equipment_name: string;
  parameter: string;
  shift: ShiftType;
  reported_by: string;
  division: 'CNSD' | 'TFP';
}

// ─── Work Order ────────────────────────────────────────────
export type WOStatus = 'completed' | 'on_hold' | 'ongoing';
// shift = all personnel on duty, personal = specific technician,
// gm_directive = directive issued by General Manager to a Manager Teknik
// (optionally with a Supervisor), no technicians assigned.
export type WOType = 'shift' | 'personal' | 'gm_directive';
export type OutputType = 'meter_reading' | 'status_peralatan' | 'logbook' | 'other';
export type CompletionStatus = 'selesai' | 'belum_selesai_dilanjut' | 'tidak_bisa';

export interface WOPersonnel {
  user_id: number;
  name: string;
  role_label: string;
  signature_url?: string;
}

export type WorkOrderSignatureRole = 'mt' | 'supervisor' | 'technician';

export interface WorkOrderSignatureInfo {
  name: string | null;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface WorkOrder {
  id: number;
  wo_number: string;
  wo_type: WOType; // NEW: shift or personal
  division: 'CNSD' | 'TFP';
  shift_id?: number | null;
  shift_type: ShiftType;
  shift_date: string;
  manager_id?: number;
  supervisor_id?: number | null;
  assigned_technician_id?: number | null; // NEW: for personal WO only
  has_supervisor?: boolean;
  personnel: WOPersonnel[];
  description: string;
  output_types: OutputType[];
  output_other?: string;
  start_time?: string;
  end_time?: string;
  completion_status?: CompletionStatus;
  notes_kendala?: string;
  notes_usulan?: string;
  notes_pemberi_tugas?: string;
  status: WOStatus;
  manager_name_snapshot?: string;
  supervisor_name_snapshot?: string | null;
  mt_name?: string | null;
  supervisor_name?: string | null;
  technician_name?: string | null;
  required_signatures?: WorkOrderSignatureRole[];
  pending_signatures?: WorkOrderSignatureRole[];
  signatures?: Partial<Record<WorkOrderSignatureRole, WorkOrderSignatureInfo>>;
  created_by: number;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  manager?: { id: number; name: string };
  supervisor?: { id: number; name: string } | null;
  creator?: { id: number; name: string; role?: string } | null;
}

// ─── CNSD Equipment ────────────────────────────────────────
export interface CnsdCategory {
  id: number;
  code: string;
  name: string;
  location: string;
  is_active_mvp: boolean;
  sort_order: number;
}

export interface EQ1RowData {
  no: number;
  equipment: string;
  status: 'Normal' | 'Tidak Normal';
  keterangan: string;
  // Additional fields vary by section
  server_aktif?: string;
  dual_state?: string;
  type?: string;
  dual_status?: string;
  freq?: string;
  tx_operasi?: string;
  channel_aktif?: string;
  server_state?: string;
  workstation_state?: string;
}

export interface EQ1SectionData {
  section_id: number;
  section_title: string;
  rows: EQ1RowData[];
}

export interface CnsdMeterReading {
  id: number;
  category_id: number;
  shift_type: ShiftType;
  shift_date: string;
  checked_by: number;
  sections: EQ1SectionData[];
  overall_status: 'normal' | 'abnormal';
  notes?: string;
  created_at: string;
}

// ─── TFP Performance Check ─────────────────────────────────
export interface TfpCategory {
  id: number;
  code: string;
  name: string;
  location: string;
  is_active_mvp: boolean;
  sort_order: number;
}

export interface AOBMeasurementRow {
  no: number;
  label: string;
  type?: 'number' | 'toggle';
  options?: string[];
  panel_cos_a03?: { input?: string; output?: string; active: boolean };
  panel_ats_a12?: { input?: string; output?: string; active: boolean };
  ups_tescom_a?: { input?: string; output?: string; active: boolean };
  ups_tescom_b?: { input?: string; output?: string; active: boolean };
}

export interface AOBFacilityItem {
  name: string;
  condition: 'Baik' | 'Tidak Baik';
  note_default?: string;
  keterangan: string;
}

export interface TfpPerformanceCheck {
  id: number;
  category_id: number;
  shift_type: ShiftType;
  shift_date: string;
  checked_by: number;
  measurements: AOBMeasurementRow[];
  facilities: AOBFacilityItem[];
  overall_status: 'ok' | 'ada_masalah';
  notes?: string;
  created_at: string;
}

// ─── Maintenance Reports ───────────────────────────────────
export type ReportType =
  | 'kondisi_fasilitas'
  | 'evaluasi_kinerja'
  | 'laporan_kerusakan'
  | 'riwayat_pemeliharaan';

export type ReportStatus = 'draft' | 'pending_manager' | 'final' | 'rejected';

export interface MaintenanceReport {
  id: number;
  title: string;
  report_type: ReportType;
  description?: string;
  related_equipment?: string;
  facility: 'CNSD' | 'TFP' | 'ALL';
  content?: Record<string, unknown>;
  narrative?: string;
  file_url?: string;
  status: ReportStatus;
  submitted_at?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  reject_reason?: string;
  period_start?: string;
  period_end?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  reviewer?: { id: number; name: string };
  creator?: { id: number; name: string };
}

// ─── Logbook ───────────────────────────────────────────────
export interface Logbook {
  id: number;
  division: 'CNSD' | 'TFP';
  month: number;
  year: number;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  notes?: string;
  uploaded_by: number;
  created_at: string;
  uploader?: { id: number; name: string };
}

// ─── Ground Check / Meter Reading ──────────────────────────

/**
 * Equipment item as stored in the backend (ground_check_readings table).
 * Used when data comes from the real API.
 */
export interface MeterReadingEquipment {
  id: string;
  name: string;
  category: 'Navigation' | 'Communication';
  frequency?: string;
  status: 'Normal' | 'Tidak Normal';
  // API shape (from backend)
  shift_date?: string;
  shift_type?: ShiftType;
  checked_by?: number;
  // Display-only fields (resolved from local_users or mock)
  lastChecked: string;
  checkedBy: string;
}

// ─── Grounding Report ──────────────────────────────────────
export interface GroundingVisualItem {
  no: number;
  name: string;
  ketersediaan: 'Ada' | 'Tidak Ada' | '';
  kondisi: 'Baik' | 'Tidak Baik' | '';
  catatan: string;
}

export interface GroundingMeasurementItem {
  no: number;
  name: string;
  standard: string;
  kondisi: 'Baik' | 'Tidak Baik' | '';
  hasilPengukuran: string;
}

export interface GroundingReport {
  id: number;
  kantorUnitKerja: string;
  namaPeralatan: string;
  lokasiPeralatan: string;
  tanggal: string;
  dibuatOleh: string;
  disetujuiOleh: string;
  lokasiKerja: string;
  visualItems: GroundingVisualItem[];
  measurementItems: GroundingMeasurementItem[];
}

// ─── Pagination ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
