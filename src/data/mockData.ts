import type {
  User,
  ShiftScheduleResponse,
  DashboardChecklistItem,
  TroubleEquipment,
  WorkOrder,
  CnsdCategory,
  TfpCategory,
  MaintenanceReport,
  Logbook,
  Notification,
} from '@/types';

// ─── Users ─────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 1, name: 'Budi Santoso', email: 'budi@airnav.co.id', role: 'Manager Teknik', is_active: true, signature_url: '/mock-sig.png' },
  { id: 2, name: 'Arif Wibowo', email: 'arif@airnav.co.id', role: 'Supervisor CNSD', is_active: true, signature_url: '/mock-sig.png' },
  { id: 3, name: 'Rini Susanti', email: 'rini@airnav.co.id', role: 'Supervisor TFP', is_active: true, signature_url: '/mock-sig.png' },
  { id: 4, name: 'Hendra Kurniawan', email: 'hendra@airnav.co.id', role: 'Teknisi CNSD', is_active: true, signature_url: '/mock-sig.png' },
  { id: 5, name: 'Dedi Prasetyo', email: 'dedi@airnav.co.id', role: 'Teknisi TFP', is_active: true, signature_url: '/mock-sig.png' },
  { id: 6, name: 'Siti Aminah', email: 'siti@airnav.co.id', role: 'Teknisi CNSD', is_active: true, signature_url: '/mock-sig.png' },
  { id: 7, name: 'Admin System', email: 'admin@airnav.co.id', role: 'Admin', is_active: true },
];

// ─── Shift Schedule ────────────────────────────────────────
export function getCurrentShift(): 'pagi' | 'siang' | 'malam' {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 13) return 'pagi';
  if (hour >= 13 && hour < 19) return 'siang';
  return 'malam';
}

export const mockShiftSchedule: ShiftScheduleResponse = {
  current_shift: getCurrentShift(),
  shift_start: getCurrentShift() === 'pagi' ? '07:00' : getCurrentShift() === 'siang' ? '13:00' : '19:00',
  shift_end: getCurrentShift() === 'pagi' ? '13:00' : getCurrentShift() === 'siang' ? '19:00' : '07:00',
  date: new Date().toISOString().split('T')[0],
  personnel: [
    { id: 1, name: 'Budi Santoso', role: 'Manager Teknik', division: 'Management' },
    { id: 2, name: 'Arif Wibowo', role: 'Supervisor CNSD', division: 'CNSD' },
    { id: 3, name: 'Rini Susanti', role: 'Supervisor TFP', division: 'TFP' },
    { id: 4, name: 'Hendra Kurniawan', role: 'Teknisi CNSD', division: 'CNSD' },
    { id: 6, name: 'Siti Aminah', role: 'Teknisi CNSD', division: 'CNSD' },
    { id: 5, name: 'Dedi Prasetyo', role: 'Teknisi TFP', division: 'TFP' },
  ],
};

// ─── Dashboard Checklist ───────────────────────────────────
export const mockChecklist: DashboardChecklistItem[] = [
  { id: 'cnsd-eq1', label: 'Kesiapan Peralatan CNSD', division: 'CNSD', is_active: true, is_completed: true, route: '/cnsd/eq-1' },
  { id: 'cnsd-shelter', label: 'Shelter ILS & Transmitter', division: 'CNSD', is_active: false, is_completed: false },
  { id: 'tfp-aob', label: 'Performance Check AOB Lantai Ground', division: 'TFP', is_active: true, is_completed: false, route: '/tfp/aob-ground' },
  { id: 'tfp-pagi', label: 'Performance Check Pagi', division: 'TFP', is_active: false, is_completed: false },
];

// ─── Trouble Equipment ─────────────────────────────────────
export const mockTroubleEquipment: TroubleEquipment[] = [
  { id: 1, equipment_name: 'CDU Secondary', parameter: 'Frekuensi drift ±0.02 MHz', shift: 'pagi', reported_by: 'Hendra Kurniawan', division: 'CNSD' },
  { id: 2, equipment_name: 'MSSR', parameter: 'Main-Standby issue', shift: 'pagi', reported_by: 'Siti Aminah', division: 'CNSD' },
  { id: 3, equipment_name: 'ASMGCS', parameter: 'No sensor MLAT', shift: 'malam', reported_by: 'Hendra Kurniawan', division: 'CNSD' },
];

// ─── Work Orders ───────────────────────────────────────────
export const mockWorkOrders: WorkOrder[] = [
  {
    id: 1,
    wo_number: 'WO-CNSD-12-04-2026-001',
    wo_type: 'shift', // WO for all personnel in shift
    division: 'CNSD',
    shift_type: 'pagi',
    shift_date: '2026-04-12',
    description: 'Pemeriksaan VCCS Merk Frequentis dan Voice Recorder. Pastikan server A & B berfungsi normal.',
    output_types: ['meter_reading', 'status_peralatan'],
    personnel: [
      { user_id: 4, name: 'Hendra Kurniawan', role_label: 'Teknisi 1', signature_url: '/mock-sig.png' },
      { user_id: 6, name: 'Siti Aminah', role_label: 'Teknisi 2', signature_url: '/mock-sig.png' },
    ],
    status: 'open',
    manager_name_snapshot: 'Budi Santoso',
    supervisor_name_snapshot: 'Arif Wibowo',
    supervisor_id: 2,
    manager_id: 1,
    created_by: 2,
    created_at: '2026-04-12T07:15:00Z',
    updated_at: '2026-04-12T07:15:00Z',
    manager: { id: 1, name: 'Budi Santoso' },
    supervisor: { id: 2, name: 'Arif Wibowo' },
  },
  {
    id: 2,
    wo_number: 'WO-TFP-12-04-2026-001',
    wo_type: 'shift', // WO for all personnel in shift
    division: 'TFP',
    shift_type: 'pagi',
    shift_date: '2026-04-12',
    description: 'Pengecekan UPS Tescom A dan B. Verifikasi tegangan battery dan arus battery.',
    output_types: ['meter_reading', 'logbook'],
    personnel: [
      { user_id: 5, name: 'Dedi Prasetyo', role_label: 'Teknisi 1', signature_url: '/mock-sig.png' },
    ],
    status: 'in_progress',
    start_time: '07:30',
    manager_name_snapshot: 'Budi Santoso',
    supervisor_name_snapshot: 'Rini Susanti',
    supervisor_id: 3,
    manager_id: 1,
    created_by: 3,
    created_at: '2026-04-12T07:20:00Z',
    updated_at: '2026-04-12T07:30:00Z',
    manager: { id: 1, name: 'Budi Santoso' },
    supervisor: { id: 3, name: 'Rini Susanti' },
  },
  {
    id: 3,
    wo_number: 'WO-CNSD-11-04-2026-002',
    wo_type: 'shift',
    division: 'CNSD',
    shift_type: 'malam',
    shift_date: '2026-04-11',
    description: 'Perbaikan MSSR Main-Standby switching. Koordinasi dengan tim radar.',
    output_types: ['status_peralatan', 'logbook'],
    personnel: [
      { user_id: 4, name: 'Hendra Kurniawan', role_label: 'Teknisi 1', signature_url: '/mock-sig.png' },
    ],
    status: 'pending',
    start_time: '19:45',
    end_time: '23:30',
    completion_status: 'belum_selesai_dilanjut',
    notes_kendala: 'Sparepart switching module belum tersedia. Sementara menggunakan manual switching.',
    notes_usulan: 'Segera pesan switching module dari gudang pusat.',
    manager_name_snapshot: 'Budi Santoso',
    supervisor_name_snapshot: 'Arif Wibowo',
    supervisor_id: 2,
    manager_id: 1,
    created_by: 2,
    created_at: '2026-04-11T19:30:00Z',
    updated_at: '2026-04-11T23:35:00Z',
    manager: { id: 1, name: 'Budi Santoso' },
    supervisor: { id: 2, name: 'Arif Wibowo' },
  },
  {
    id: 4,
    wo_number: 'WO-CNSD-12-04-2026-P001',
    wo_type: 'personal', // Personal WO for specific technician
    division: 'CNSD',
    shift_type: 'pagi',
    shift_date: '2026-04-12',
    assigned_technician_id: 4, // Assigned to Hendra Kurniawan
    description: 'Kalibrasi CDU Secondary setelah drift frekuensi. Pastikan frekuensi kembali ke toleransi normal.',
    output_types: ['meter_reading', 'status_peralatan'],
    personnel: [
      { user_id: 4, name: 'Hendra Kurniawan', role_label: 'Teknisi', signature_url: '/mock-sig.png' },
    ],
    status: 'open',
    manager_name_snapshot: 'Budi Santoso',
    supervisor_name_snapshot: 'Arif Wibowo',
    supervisor_id: 2,
    manager_id: 1,
    created_by: 1, // Created by Manager
    created_at: '2026-04-12T08:00:00Z',
    updated_at: '2026-04-12T08:00:00Z',
    manager: { id: 1, name: 'Budi Santoso' },
    supervisor: { id: 2, name: 'Arif Wibowo' },
  },
  {
    id: 5,
    wo_number: 'WO-TFP-10-04-2026-001',
    wo_type: 'shift',
    division: 'TFP',
    shift_type: 'siang',
    shift_date: '2026-04-10',
    description: 'Pemeliharaan rutin AC Split Wall 01-04 ruang equipment AOB Ground.',
    output_types: ['logbook', 'other'],
    output_other: 'Laporan pemeliharaan AC',
    personnel: [
      { user_id: 5, name: 'Dedi Prasetyo', role_label: 'Teknisi 1', signature_url: '/mock-sig.png' },
    ],
    status: 'closed',
    start_time: '13:15',
    end_time: '16:00',
    completion_status: 'selesai',
    notes_kendala: 'AC 03 filter perlu diganti dalam 2 minggu ke depan.',
    notes_pemberi_tugas: 'Noted, siapkan SPK pembelian filter AC.',
    manager_name_snapshot: 'Budi Santoso',
    supervisor_name_snapshot: 'Rini Susanti',
    supervisor_id: 3,
    manager_id: 1,
    created_by: 3,
    created_at: '2026-04-10T13:00:00Z',
    updated_at: '2026-04-10T16:30:00Z',
    closed_at: '2026-04-10T16:30:00Z',
    manager: { id: 1, name: 'Budi Santoso' },
    supervisor: { id: 3, name: 'Rini Susanti' },
  },
];

// ─── CNSD Categories ───────────────────────────────────────
export const mockCnsdCategories: CnsdCategory[] = [
  { id: 1, code: 'CNSD-001', name: 'Kesiapan Peralatan CNSD', location: 'Main Equipment Room', is_active_mvp: true, sort_order: 1 },
  { id: 2, code: 'CNSD-002', name: 'Radar', location: 'Gedung Radar', is_active_mvp: false, sort_order: 2 },
  { id: 3, code: 'CNSD-003', name: 'Recorder', location: 'Main Equipment Room', is_active_mvp: false, sort_order: 3 },
  { id: 4, code: 'CNSD-004', name: 'AMSC', location: 'Ruang AMSC', is_active_mvp: false, sort_order: 4 },
  { id: 5, code: 'CNSD-005', name: 'Transmitter', location: 'Gedung Transmitter', is_active_mvp: false, sort_order: 5 },
  { id: 6, code: 'CNSD-006', name: 'Receiver', location: 'Gedung Transmitter', is_active_mvp: false, sort_order: 6 },
  { id: 7, code: 'CNSD-007', name: 'Glide Path', location: 'Shelter Glide Path', is_active_mvp: false, sort_order: 7 },
  { id: 8, code: 'CNSD-008', name: 'Localizer', location: 'Shelter Localizer', is_active_mvp: false, sort_order: 8 },
  { id: 9, code: 'CNSD-009', name: 'T-DME', location: 'Shelter Glide Path', is_active_mvp: false, sort_order: 9 },
  { id: 10, code: 'CNSD-010', name: 'DVOR', location: 'Shelter VOR', is_active_mvp: false, sort_order: 10 },
  { id: 11, code: 'CNSD-011', name: 'DME', location: 'Shelter VOR', is_active_mvp: false, sort_order: 11 },
  { id: 12, code: 'CNSD-012', name: 'ATC System', location: 'Main Equipment Room', is_active_mvp: false, sort_order: 12 },
  { id: 13, code: 'CNSD-013', name: 'ATIS', location: 'Main Equipment Room', is_active_mvp: false, sort_order: 13 },
];

// ─── TFP Categories ────────────────────────────────────────
export const mockTfpCategories: TfpCategory[] = [
  { id: 1, code: 'TFP-001', name: 'Performance Check AOB Lantai Ground', location: 'AOB Lantai Ground', is_active_mvp: true, sort_order: 1 },
  { id: 2, code: 'TFP-002', name: 'AOB Lantai 1 & 2', location: 'AOB Lantai 1-2', is_active_mvp: false, sort_order: 2 },
  { id: 3, code: 'TFP-003', name: 'Transmitter (TFP)', location: 'Gedung Transmitter', is_active_mvp: false, sort_order: 3 },
  { id: 4, code: 'TFP-004', name: 'Radar (TFP)', location: 'Gedung Radar', is_active_mvp: false, sort_order: 4 },
  { id: 5, code: 'TFP-005', name: 'Tower', location: 'ATC Tower', is_active_mvp: false, sort_order: 5 },
  { id: 6, code: 'TFP-006', name: 'VOR (TFP)', location: 'Shelter VOR', is_active_mvp: false, sort_order: 6 },
  { id: 7, code: 'TFP-007', name: 'Localizer (TFP)', location: 'Shelter Localizer', is_active_mvp: false, sort_order: 7 },
  { id: 8, code: 'TFP-008', name: 'Glide Path (TFP)', location: 'Shelter Glide Path', is_active_mvp: false, sort_order: 8 },
];

// ─── Maintenance Reports ───────────────────────────────────
export const mockReports: MaintenanceReport[] = [
  {
    id: 1, title: 'Laporan Kondisi Fasilitas Telekomunikasi — Maret 2026', report_type: 'kondisi_fasilitas',
    description: 'Ringkasan kondisi seluruh fasilitas CNSD bulan Maret 2026.',
    facility: 'CNSD', status: 'final', period_start: '2026-03-01', period_end: '2026-03-31',
    submitted_at: '2026-04-02T08:00:00Z', reviewed_by: 1, reviewed_at: '2026-04-03T09:00:00Z',
    created_by: 2, created_at: '2026-04-01T10:00:00Z', updated_at: '2026-04-03T09:00:00Z',
    reviewer: { id: 1, name: 'Budi Santoso' }, creator: { id: 2, name: 'Arif Wibowo' },
  },
  {
    id: 2, title: 'Evaluasi Kinerja Fasilitas Q1 2026', report_type: 'evaluasi_kinerja',
    description: 'Evaluasi triwulan pertama kinerja fasilitas TFP.',
    facility: 'TFP', status: 'pending_manager', period_start: '2026-01-01', period_end: '2026-03-31',
    submitted_at: '2026-04-05T14:00:00Z',
    created_by: 3, created_at: '2026-04-04T10:00:00Z', updated_at: '2026-04-05T14:00:00Z',
    creator: { id: 3, name: 'Rini Susanti' },
  },
  {
    id: 3, title: 'Laporan Kerusakan UPS Tescom B', report_type: 'laporan_kerusakan',
    description: 'Kerusakan pada modul battery UPS Tescom B di AOB Ground.',
    related_equipment: 'UPS Tescom B', facility: 'TFP', status: 'draft',
    period_start: '2026-04-10', period_end: '2026-04-10',
    created_by: 3, created_at: '2026-04-10T16:00:00Z', updated_at: '2026-04-10T16:00:00Z',
    creator: { id: 3, name: 'Rini Susanti' },
  },
  {
    id: 4, title: 'Riwayat Pemeliharaan VCCS — Q1 2026', report_type: 'riwayat_pemeliharaan',
    description: 'Riwayat lengkap pemeliharaan VCCS Frequentis.',
    related_equipment: 'VCCS Merk Frequentis', facility: 'CNSD', status: 'rejected',
    reject_reason: 'Data pemeliharaan bulan Februari belum lengkap. Mohon dilengkapi sebelum diajukan kembali.',
    period_start: '2026-01-01', period_end: '2026-03-31',
    submitted_at: '2026-04-06T09:00:00Z', reviewed_by: 1, reviewed_at: '2026-04-07T11:00:00Z',
    created_by: 2, created_at: '2026-04-05T10:00:00Z', updated_at: '2026-04-07T11:00:00Z',
    reviewer: { id: 1, name: 'Budi Santoso' }, creator: { id: 2, name: 'Arif Wibowo' },
  },
];

// ─── Logbooks ──────────────────────────────────────────────
export const mockLogbooks: Logbook[] = [
  {
    id: 1, division: 'CNSD', month: 3, year: 2026, title: 'Logbook CNSD Maret 2026',
    file_path: '/storage/logbooks/cnsd/2026/03/logbook_maret.pdf', file_name: 'logbook_cnsd_maret_2026.pdf',
    file_size: 2048576, file_type: 'application/pdf', uploaded_by: 2,
    created_at: '2026-04-01T08:00:00Z', uploader: { id: 2, name: 'Arif Wibowo' },
  },
  {
    id: 2, division: 'TFP', month: 3, year: 2026, title: 'Logbook TFP Maret 2026',
    file_path: '/storage/logbooks/tfp/2026/03/logbook_maret.pdf', file_name: 'logbook_tfp_maret_2026.pdf',
    file_size: 1536000, file_type: 'application/pdf', uploaded_by: 3,
    created_at: '2026-04-01T09:00:00Z', uploader: { id: 3, name: 'Rini Susanti' },
  },
  {
    id: 3, division: 'CNSD', month: 2, year: 2026, title: 'Logbook CNSD Februari 2026',
    file_path: '/storage/logbooks/cnsd/2026/02/logbook_feb.pdf', file_name: 'logbook_cnsd_feb_2026.pdf',
    file_size: 1892345, file_type: 'application/pdf', uploaded_by: 2,
    created_at: '2026-03-01T08:00:00Z', uploader: { id: 2, name: 'Arif Wibowo' },
  },
];

// ─── Notifications ─────────────────────────────────────────
export const mockNotifications: Notification[] = [
  { id: 1, type: 'WorkOrderCreated', title: 'Work Order Baru', message: 'WO-CNSD-12-04-2026-001 telah dibuat oleh Arif Wibowo', is_read: false, created_at: '2026-04-12T07:15:00Z' },
  { id: 2, type: 'WorkOrderStatusChanged', title: 'Status WO Berubah', message: 'WO-TFP-12-04-2026-001 sedang In Progress', is_read: false, created_at: '2026-04-12T07:30:00Z' },
  { id: 3, type: 'ReportApprovalNeeded', title: 'Laporan Perlu Persetujuan', message: 'Evaluasi Kinerja Fasilitas Q1 2026 menunggu persetujuan Anda', is_read: false, created_at: '2026-04-05T14:00:00Z' },
  { id: 4, type: 'AbnormalEquipmentDetected', title: 'Peralatan Abnormal', message: 'CDU Secondary menunjukkan frekuensi drift ±0.02 MHz', is_read: true, created_at: '2026-04-12T07:45:00Z' },
  { id: 5, type: 'ReportRejected', title: 'Laporan Ditolak', message: 'Riwayat Pemeliharaan VCCS ditolak oleh Manager Teknik', is_read: true, created_at: '2026-04-07T11:00:00Z' },
];
